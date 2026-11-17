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

import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const MAX_HTML_BYTES = 100_000;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 8_000;

// Every address range that isn't the public internet: loopback, RFC 1918 private ranges,
// link-local (incl. cloud metadata at 169.254.169.254), CGNAT, multicast, reserved and
// documentation ranges, and their IPv6 equivalents. Fetching any of these on a caller's
// behalf would let anyone use this public endpoint to probe the host's internal network.
const BLOCKED = new BlockList();
for (const [net, prefix] of [
	["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
	["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
	["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
	["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
]) BLOCKED.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
	["::", 128], ["::1", 128], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64],
	["2001::", 32], ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10],
	["fec0::", 10], ["ff00::", 8],
]) BLOCKED.addSubnet(net, prefix, "ipv6");

export function isBlockedAddress(address) {
	const family = isIP(address);
	if (family === 4) return BLOCKED.check(address, "ipv4");
	if (family === 6) return BLOCKED.check(address, "ipv6");
	return true;
}

// Parses and validates a caller-supplied URL: http(s) only, default ports only, and no
// credentials. Does NOT check where the host resolves - see assertPublicHost for that.
export function parseTargetUrl(rawUrl) {
	const parsed = new URL(rawUrl);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
	if (parsed.port !== "") throw new Error("non-default port");
	if (parsed.username || parsed.password) throw new Error("credentials in url");
	const host = parsed.hostname.toLowerCase();
	if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
		throw new Error("blocked host");
	}
	return parsed;
}

// Resolves the URL's host and rejects it if ANY resolved address is non-public.
async function assertPublicHost(parsed) {
	const host = parsed.hostname.replace(/^\[|\]$/g, "");
	const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
	if (!addresses.length || addresses.some(a => isBlockedAddress(a.address))) {
		throw new Error("blocked address");
	}
}

// Reads at most maxBytes of a response body as text - keeps a hostile/huge page from
// making the function buffer an unbounded amount of data.
export async function readBounded(resp, maxBytes) {
	if (!resp.body) return "";
	const reader = resp.body.getReader();
	const chunks = [];
	let total = 0;
	while (total < maxBytes) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		total += value.length;
	}
	try {
		await reader.cancel();
	} catch {
		// ignore
	}
	return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes));
}

// Fetches a page's HTML. Redirects are followed by hand (not redirect: "follow") so every
// hop is re-validated - otherwise a public URL could simply 302 to an internal address.
export async function fetchHtml(url) {
	let current = parseTargetUrl(url);
	const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		await assertPublicHost(current);
		const resp = await fetch(current.toString(), {
			redirect: "manual",
			signal,
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
		});
		if (resp.status >= 300 && resp.status < 400) {
			const location = resp.headers.get("location");
			try {
				await resp.body?.cancel();
			} catch {
				// ignore
			}
			if (!location) return null;
			current = parseTargetUrl(new URL(location, current).toString());
			continue;
		}
		const contentType = resp.headers.get("content-type") || "";
		if (!contentType.includes("text/html")) {
			try {
				await resp.body?.cancel();
			} catch {
				// ignore
			}
			return null;
		}
		const html = await readBounded(resp, MAX_HTML_BYTES);
		return { html, finalUrl: current.toString() };
	}
	throw new Error("too many redirects");
}

// Raster image types that are safe to serve straight from this origin. SVG is
// deliberately excluded from this list: it can carry script, so it's only served
// under SAFE_INLINE_IMAGE_HEADERS' sandboxing CSP (see isSafeDataImageMime).
const SAFE_RASTER_MIMES = new Set([
	"image/png", "image/jpeg", "image/gif", "image/webp", "image/avif",
	"image/x-icon", "image/vnd.microsoft.icon", "image/bmp",
]);

// A data: favicon's MIME type comes from the (untrusted) target page. Anything that isn't
// an image - text/html above all - must never be served from this origin, or a page
// declaring <link rel="icon" href="data:text/html,<script>..."> would get script running
// here when someone opens the /api/favicon URL directly.
export function isSafeDataImageMime(mime) {
	const m = String(mime).trim().toLowerCase();
	return SAFE_RASTER_MIMES.has(m) || m === "image/svg+xml";
}

// Headers for any image bytes served directly: no MIME sniffing, and a CSP that blocks
// script and sandboxes the document even if the file (e.g. an SVG) is opened directly.
export const SAFE_INLINE_IMAGE_HEADERS = {
	"x-content-type-options": "nosniff",
	"content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
};

// Only ever hand back http(s) or safe data:image URLs - never javascript: or the like.
export function isSafeImageUrl(url) {
	if (typeof url !== "string") return false;
	if (url.startsWith("https:") || url.startsWith("http:")) return true;
	const m = url.match(/^data:([^;,]*)/i);
	return Boolean(m && isSafeDataImageMime(m[1]));
}
