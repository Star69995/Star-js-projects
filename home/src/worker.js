const LINKS_KEY = "links";

const DEFAULT_LINKS = [
	{ id: "1", name: "האתר של סטאר", url: "https://star69995.github.io/star-site/" },
	{ id: "2", name: "צעד קדימה", url: "https://beyond-borders-23adb.web.app/" },
	{ id: "3", name: "תשבץ", url: "https://star-crossword.vercel.app/" },
	{ id: "4", name: "תשבץ דמו", url: "https://star69995.github.io/star-crossword/" },
	{ id: "5", name: "קריפטוגרמה", url: "https://star69995.github.io/star-site/js-projects/cryptogram/" },
	{ id: "6", name: "שעון עצר", url: "https://star69995.github.io/star-site/js-projects/timer/" },
	{ id: "7", name: "מנהל משימות", url: "https://star69995.github.io/star-site/js-projects/task_manager/" },
	{ id: "8", name: "משחק מתמטי", url: "https://star69995.github.io/star-site/js-projects/mathGame/" },
	{ id: "9", name: "מזג אוויר", url: "https://star69995.github.io/star-site/js-projects/weather/" },
	{ id: "10", name: "מחשבון קרשים", url: "https://star69995.github.io/star-site/js-projects/wood-calc/" },
];

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});
}

function isAuthorized(request, env) {
	const provided = request.headers.get("x-edit-password") || "";
	return env.EDIT_PASSWORD && provided === env.EDIT_PASSWORD;
}

function sanitizeLinks(list) {
	if (!Array.isArray(list)) return null;
	const cleaned = [];
	for (const item of list) {
		if (!item || typeof item !== "object") return null;
		const name = String(item.name ?? "").trim().slice(0, 100);
		const url = String(item.url ?? "").trim().slice(0, 500);
		if (!name || !url) return null;
		try {
			const parsed = new URL(url);
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
		} catch {
			return null;
		}
		const id = String(item.id ?? crypto.randomUUID()).slice(0, 100);
		cleaned.push({ id, name, url });
	}
	return cleaned;
}

async function handleGetLinks(env) {
	const stored = await env.LINKS.get(LINKS_KEY, "json");
	return json(stored ?? DEFAULT_LINKS);
}

async function handleSaveLinks(request, env) {
	if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid json" }, 400);
	}
	const cleaned = sanitizeLinks(body.links);
	if (!cleaned) return json({ error: "invalid links" }, 400);
	await env.LINKS.put(LINKS_KEY, JSON.stringify(cleaned));
	return json({ ok: true, links: cleaned });
}

async function handleCheckPassword(request, env) {
	return json({ ok: isAuthorized(request, env) });
}

async function handleMeta(request, env) {
	if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
	const targetUrl = new URL(request.url).searchParams.get("url") || "";
	let parsed;
	try {
		parsed = new URL(targetUrl);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
	} catch {
		return json({ error: "invalid url" }, 400);
	}

	let title = "";
	try {
		const resp = await fetch(parsed.toString(), {
			redirect: "follow",
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
			cf: { cacheTtl: 3600, cacheEverything: true },
		});
		const contentType = resp.headers.get("content-type") || "";
		if (contentType.includes("text/html")) {
			const html = await resp.text();
			const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
			if (match) title = decodeHtmlEntities(match[1].trim());
		}
	} catch {
		// ignore fetch failures, fall back to hostname
	}

	if (!title) title = parsed.hostname.replace(/^www\./, "");

	const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(parsed.hostname)}`;
	return json({ title, favicon });
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

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === "/api/links") {
			if (request.method === "GET") return handleGetLinks(env);
			if (request.method === "PUT") return handleSaveLinks(request, env);
			return json({ error: "method not allowed" }, 405);
		}

		if (url.pathname === "/api/check-password" && request.method === "POST") {
			return handleCheckPassword(request, env);
		}

		if (url.pathname === "/api/meta" && request.method === "GET") {
			return handleMeta(request, env);
		}

		return env.ASSETS.fetch(request);
	},
};
