// Public, read-only thumbnail lookup: prefers the target site's own
// <meta property="og:image"> (what the site itself wants shown when shared/linked),
// falling back to an mshots-generated screenshot when absent. Ported from
// home/src/worker.js's handleThumbnail - kept here (off Cloudflare) because a Cloudflare
// Worker fetching another *.workers.dev site is blocked with "error 1042"; a normal
// server (this one) fetching the same URL is not.

import { extractOgImage, extractMetaDescription, parseTargetUrl, fetchHtml } from "../lib/extract.js";

export default async function handler(req, res) {
	res.setHeader("access-control-allow-origin", "*");
	if (req.method === "OPTIONS") {
		res.status(204).end();
		return;
	}

	let parsed;
	try {
		parsed = parseTargetUrl(typeof req.query.url === "string" ? req.query.url : "");
	} catch {
		res.status(400).json({ error: "invalid url" });
		return;
	}

	let ogImage = null;
	let description = null;
	try {
		const result = await fetchHtml(parsed.toString());
		if (result) {
			ogImage = extractOgImage(result.html, result.finalUrl);
			description = extractMetaDescription(result.html);
		}
	} catch {
		// ignore fetch failures, fall back to mshots below
	}

	const url = ogImage ?? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(parsed.toString())}?w=400&h=250`;
	res.setHeader("cache-control", "public, max-age=3600");
	res.status(200).json({ url, description });
}
