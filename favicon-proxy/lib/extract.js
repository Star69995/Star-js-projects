// Shared HTML-scraping helpers used by api/favicon.js, api/thumbnail.js, and api/meta.js.
// Ported from home/src/worker.js - see favicon-proxy/README.md for why this lives here
// instead of on the Cloudflare Worker.

// Finds the href of the site's own <link rel="icon"|"shortcut icon"|"apple-touch-icon">,
// resolved to an absolute URL. Prefers a plain "icon"/"shortcut icon" match if present.
export function extractIconHref(html, baseUrl) {
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

// Finds the resolved <meta property="og:image"> (or twitter:image as a fallback) content,
// resolved to an absolute URL. Attribute order (property/content) is not assumed.
export function extractOgImage(html, baseUrl) {
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
export function extractMetaDescription(html) {
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

export function decodeHtmlEntities(str) {
	return str
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
}

// Decodes a data: URI (base64 or percent-encoded) into a Buffer with the right content-type.
export function dataUriToBuffer(dataUri) {
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

export function parseTargetUrl(rawUrl) {
	const parsed = new URL(rawUrl);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
	return parsed;
}

export async function fetchHtml(url) {
	const resp = await fetch(url, {
		redirect: "follow",
		headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
	});
	const contentType = resp.headers.get("content-type") || "";
	if (!contentType.includes("text/html")) return null;
	const html = (await resp.text()).slice(0, 100_000);
	return { html, finalUrl: resp.url };
}
