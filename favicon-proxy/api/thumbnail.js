// Public, read-only thumbnail lookup: prefers the target site's own
// <meta property="og:image"> (what the site itself wants shown when shared/linked),
// falling back to an mshots-generated screenshot when absent. Ported from
// home/src/worker.js's handleThumbnail - kept here (off Cloudflare) because a Cloudflare
// Worker fetching another *.workers.dev site is blocked with "error 1042"; a normal
// server (this one) fetching the same URL is not.

// Finds the resolved <meta property="og:image"> (or twitter:image as a fallback) content,
// resolved to an absolute URL. Attribute order (property/content) is not assumed.
function extractOgImage(html, baseUrl) {
	const metaTagRegex = /<meta\b[^>]*>/gi;
	let ogImage = null;
	let twitterImage = null;
	let match;
	while ((match = metaTagRegex.exec(html))) {
		const tag = match[0];
		const propMatch = tag.match(/(?:property|name)\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/i);
		const contentMatch = tag.match(/content\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/i);
		if (!propMatch || !contentMatch) continue;
		const prop = propMatch[2].trim().toLowerCase();
		if (prop === "og:image" || prop === "og:image:url") {
			ogImage = contentMatch[2];
			break;
		}
		if (!twitterImage && (prop === "twitter:image" || prop === "twitter:image:src")) {
			twitterImage = contentMatch[2];
		}
	}
	const chosen = ogImage ?? twitterImage;
	if (!chosen) return null;
	try {
		return new URL(chosen, baseUrl).toString();
	} catch {
		return null;
	}
}

// Finds the target site's own <meta property="og:description"> (or the plain
// <meta name="description"> as a fallback), so cards can show a description without
// anyone having to type one in manually.
function extractMetaDescription(html) {
	const metaTagRegex = /<meta\b[^>]*>/gi;
	let ogDescription = null;
	let plainDescription = null;
	let match;
	while ((match = metaTagRegex.exec(html))) {
		const tag = match[0];
		const propMatch = tag.match(/(?:property|name)\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/i);
		const contentMatch = tag.match(/content\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/i);
		if (!propMatch || !contentMatch) continue;
		const prop = propMatch[2].trim().toLowerCase();
		if (prop === "og:description") {
			ogDescription = contentMatch[2];
			break;
		}
		if (!plainDescription && prop === "description") {
			plainDescription = contentMatch[2];
		}
	}
	const chosen = ogDescription ?? plainDescription;
	if (!chosen) return null;
	return decodeHtmlEntities(chosen.trim()).slice(0, 300);
}

function decodeHtmlEntities(str) {
	return str
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
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
		res.status(400).json({ error: "invalid url" });
		return;
	}

	let ogImage = null;
	let description = null;
	try {
		const resp = await fetch(parsed.toString(), {
			redirect: "follow",
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
		});
		const contentType = resp.headers.get("content-type") || "";
		if (contentType.includes("text/html")) {
			const html = (await resp.text()).slice(0, 100_000);
			ogImage = extractOgImage(html, resp.url);
			description = extractMetaDescription(html);
		}
	} catch {
		// ignore fetch failures, fall back to mshots below
	}

	const url = ogImage ?? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(parsed.toString())}?w=400&h=250`;
	res.setHeader("cache-control", "public, max-age=3600");
	res.status(200).json({ url, description });
}
