// Public, read-only favicon lookup: parses the target site's own <link rel="icon">
// so callers get the site's real logo instead of a guess. Ported from
// home/src/worker.js's handleFavicon - kept here (off Cloudflare) because a Cloudflare
// Worker fetching another *.workers.dev site is blocked with "error 1042"; a normal
// server (this one) fetching the same URL is not.

// Finds the href of the site's own <link rel="icon"|"shortcut icon"|"apple-touch-icon">,
// resolved to an absolute URL. Prefers a plain "icon"/"shortcut icon" match if present.
function extractIconHref(html, baseUrl) {
	const linkTagRegex = /<link\b[^>]*>/gi;
	let bestHref = null;
	let match;
	while ((match = linkTagRegex.exec(html))) {
		const tag = match[0];
		const relMatch = tag.match(/rel\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/i);
		if (!relMatch || !relMatch[2].toLowerCase().includes("icon")) continue;
		const hrefMatch = tag.match(/href\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/i);
		if (!hrefMatch) continue;
		bestHref = hrefMatch[2];
		const relValue = relMatch[2].trim().toLowerCase();
		if (relValue === "icon" || relValue === "shortcut icon") break;
	}
	if (!bestHref) return null;
	try {
		return new URL(bestHref, baseUrl).toString();
	} catch {
		return null;
	}
}

// Decodes a data: URI (base64 or percent-encoded) into a Buffer with the right content-type.
function dataUriToBuffer(dataUri) {
	const match = dataUri.match(/^data:([^;,]*)(;base64)?,([\s\S]*)$/);
	if (!match) return null;
	const mime = match[1] || "text/plain";
	const isBase64 = Boolean(match[2]);
	try {
		const buffer = isBase64 ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]), "utf8");
		return { buffer, mime };
	} catch {
		return null;
	}
}

export default async function handler(req, res) {
	res.setHeader("access-control-allow-origin", "*");
	if (req.method === "OPTIONS") {
		res.status(204).end();
		return;
	}

	const targetUrl = typeof req.query.url === "string" ? req.query.url : "";
	let parsed;
	try {
		parsed = new URL(targetUrl);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
	} catch {
		res.status(400).end();
		return;
	}

	let iconUrl = null;
	try {
		const resp = await fetch(parsed.toString(), {
			redirect: "follow",
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
		});
		const contentType = resp.headers.get("content-type") || "";
		if (contentType.includes("text/html")) {
			const html = (await resp.text()).slice(0, 100_000);
			iconUrl = extractIconHref(html, resp.url);
		}
	} catch {
		// ignore fetch failures, respond 404 below so the client falls back
	}

	if (!iconUrl) {
		res.status(404).end();
		return;
	}

	// data: URIs (e.g. an inline SVG favicon) can't be used as a redirect target -
	// browsers block that as an unsafe redirect - so serve the decoded bytes directly.
	if (iconUrl.startsWith("data:")) {
		const decoded = dataUriToBuffer(iconUrl);
		if (!decoded) {
			res.status(404).end();
			return;
		}
		res.setHeader("content-type", decoded.mime);
		res.setHeader("cache-control", "public, max-age=3600");
		res.status(200).send(decoded.buffer);
		return;
	}

	if (!iconUrl.startsWith("http:") && !iconUrl.startsWith("https:")) {
		res.status(404).end();
		return;
	}

	res.setHeader("cache-control", "public, max-age=3600");
	res.redirect(302, iconUrl);
}
