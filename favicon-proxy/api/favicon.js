// Public, read-only favicon lookup: parses the target site's own <link rel="icon">
// so callers get the site's real logo instead of a guess. Ported from
// home/src/worker.js's handleFavicon - kept here (off Cloudflare) because a Cloudflare
// Worker fetching another *.workers.dev site is blocked with "error 1042"; a normal
// server (this one) fetching the same URL is not.

import { extractIconHref, dataUriToBuffer, parseTargetUrl, fetchHtml } from "../lib/extract.js";

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
		res.status(400).end();
		return;
	}

	let iconUrl = null;
	try {
		const result = await fetchHtml(parsed.toString());
		if (result) iconUrl = extractIconHref(result.html, result.finalUrl);
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
