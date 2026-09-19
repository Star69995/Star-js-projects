// Read-only page-metadata lookup: returns { title, favicon, description } scraped from
// the target page. Powers home's editor "שאיבת שם" (fetch info) button. Ported from
// home/src/worker.js's handleMeta - kept here (off Cloudflare) because a Cloudflare
// Worker fetching another *.workers.dev site is blocked with "error 1042"; a normal
// server (this one) fetching the same URL is not. Unlike the original, this isn't
// password-gated: it does the same read-only fetch-and-scrape as the public
// favicon/thumbnail endpoints below and touches no private data, so there's nothing to
// protect by requiring auth here.

import { extractIconHref, extractMetaDescription, decodeHtmlEntities, parseTargetUrl, fetchHtml } from "../lib/extract.js";

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

	let title = "";
	let icon = null;
	let description = null;
	try {
		const result = await fetchHtml(parsed.toString());
		if (result) {
			const match = result.html.match(/<title[^>]*>([^<]*)<\/title>/i);
			if (match) title = decodeHtmlEntities(match[1].trim());
			icon = extractIconHref(result.html, result.finalUrl);
			description = extractMetaDescription(result.html);
		}
	} catch {
		// ignore fetch failures, fall back to hostname below
	}

	if (!title) title = parsed.hostname.replace(/^www\./, "");

	const favicon = icon ?? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(parsed.hostname)}.ico`;
	res.status(200).json({ title, favicon, description });
}
