const LINKS_KEY = "links";

// Cross-origin readers of the public links list (e.g. the star-site static site).
// TEMP for local testing against http://127.0.0.1:8788 - revert to "https://star69995.github.io" before deploying.
const ALLOWED_ORIGIN = "*";
// Governs client/browser caching only - the server itself always reads KV fresh (see
// handleGetLinks), so a save is immediately visible everywhere with no server-side cache
// to purge or wait out. This is just a courtesy to repeat visitors' browsers.
const LINKS_CACHE_CONTROL = "public, max-age=86400"; // 1 day

function corsHeaders() {
	return { "access-control-allow-origin": ALLOWED_ORIGIN, "vary": "origin" };
}

const PROJECTS_KEY = "projects";
const PROJECTS_CACHE_CONTROL = "public, max-age=86400"; // 1 day - see LINKS_CACHE_CONTROL.

// Mirrors star-site/projects.json as of the day this endpoint was added, so a KV miss
// still serves the same data star-site already ships locally - not an arbitrary fallback.
const DEFAULT_PROJECTS = {
	"css-projects": [
		{
			title: "מצב הרוח כנר",
			description: "גלריית תמונות רספונסיבית עם אפקטים ייחודיים וכיתוב משעשע, המאפשרת חווית צפייה קלילה ומהנה. נבנה בעזרת HTML ו-CSS, מתאים לכל סוגי המסכים.",
			image: "img/candle.webp",
			path: "css-projects/candle/",
			zip: "css-projects/candle.zip",
			languages: ["HTML", "CSS"],
		},
		{
			title: "גופנים מגניבים",
			description: "התנסו במבחר גופנים ייחודיים - חלקם בעיצוב אישי וחלקם מ-Google Fonts. פרויקט המדגיש את עוצמת הטיפוגרפיה באמצעות HTML ו-CSS בלבד. מותאם לתצוגה במכשירים ניידים.",
			image: "img/fonts.webp",
			path: "css-projects/typography/",
			zip: "css-projects/typography.zip",
			languages: ["HTML", "CSS"],
		},
		{
			title: "קפה",
			description: "דף השארת פרטים ידידותי למשתמש, שנבנה ב-HTML ו-CSS עם יישום עיצוב מקבצי Adobe XD. מותאם לתצוגה בנייד ובמחשב.",
			image: "img/coffee.webp",
			path: "css-projects/Coffee/",
			zip: "css-projects/Coffee.zip",
			languages: ["HTML", "CSS", "Adobe XD"],
		},
		{
			title: "גריד",
			description: "עמוד גריד מודרני לאיסוף פרטים עם שדות נוספים, כולל שם, אימייל והודעת טקסט. נבנה בעזרת HTML ו-CSS עם יישום של עיצוב שהוכן מראש ב-Adobe XD. מותאם לניידים ולמחשבים.",
			image: "img/grid.webp",
			path: "css-projects/gallery/",
			zip: "css-projects/gallery.zip",
			languages: ["HTML", "CSS", "Adobe XD"],
		},
		{
			title: "הדרך קדימה",
			description: "עמוד מרשים להשארת פרטים, המותאם למגוון מסכים. נבנה ב-HTML ו-CSS עם יישום של עיצוב מקובץ Adobe XD קיים.",
			image: "img/forward.webp",
			path: "css-projects/forward/",
			zip: "css-projects/forward.zip",
			languages: ["HTML", "CSS", "Adobe XD"],
		},
		{
			title: "דף נחיתה צהוב",
			description: "דף נחיתה בולט עם רקע צהוב ועיצוב נוח לשימוש. נבנה ב-HTML ו-CSS בהתבסס על עיצוב שהוכן מראש ב-Adobe XD, ומותאם לנייד ולמחשב.",
			image: "img/yellow.webp",
			path: "css-projects/icons page/",
			zip: "css-projects/icons page.zip",
			languages: ["HTML", "CSS", "Adobe XD"],
		},
	],
	"js-projects": [
		{
			title: "קריפטוגרמה",
			description: "משחק קריפטוגרמה אינטראקטיבי שבו השחקן מפענח משפטים מוסתרים באמצעות הצפנה. המשפטים נלקחים מוויקיציטוט ומיובאים אוטומטית לקובץ JSON בעזרת קוד פייתון. המשחק מותאם לשימוש במכשירים ניידים ובמחשבים, ונבנה בטכנולוגיות HTML, CSS ו-JavaScript.",
			image: "img/cryptogram.webp",
			path: "js-projects/cryptogram/",
			zip: "js-projects/cryptogram.zip",
			languages: ["HTML", "CSS", "JavaScript", "Python"],
		},
		{
			title: "תחזית מזג אוויר",
			description: "אפליקציה אינטראקטיבית לתחזית מזג אוויר, כולל תחזית שעתית ויומית, בשילוב המלצות לבוש. נבנה באמצעות HTML, CSS ו-JavaScript עם שימוש ב-OpenWeather API.",
			image: "img/weather.webp",
			path: "js-projects/weather/",
			zip: "js-projects/weather.zip",
			languages: ["HTML", "CSS", "JavaScript", "OpenWeather API"],
		},
		{
			title: "מנהל משימות",
			description: "אפליקציה אינטראקטיבית לניהול רשימות ומשימות, עם שמירה ב-localStorage. מאפשרת הוספה, עריכה ומחיקה של משימות בצורה נוחה.",
			image: "img/task_manager.webp",
			path: "js-projects/task_manager/",
			zip: "js-projects/task_manager.zip",
			languages: ["HTML", "CSS", "JavaScript"],
		},
		{
			title: "משחק מתמטי",
			description: "משחק חידות מתמטיות לאימון המוח. כולל שלבים שונים ומשימות משתנות. נבנה ב-HTML, CSS ו-JavaScript.",
			image: "img/mathGame.webp",
			path: "js-projects/mathGame/",
			zip: "js-projects/mathGame.zip",
			languages: ["HTML", "CSS", "JavaScript"],
		},
		{
			title: "מחשבון עץ",
			description: "מחשבון עץ המאפשר לבצע חישובים בתחום חיתוך עץ. מיועד גם למכשירים ניידים וגם למחשבים, נבנה ב-HTML, CSS ו-JavaScript.",
			image: "img/wood-calc.webp",
			path: "js-projects/wood-calc/",
			zip: "js-projects/wood-calc.zip",
			languages: ["HTML", "CSS", "JavaScript"],
		},
		{
			title: "שעון עצר",
			description: "פרויקט שעון עצר מותאם למכשירים ניידים ובמחשבים, נבנה ב-HTML, CSS ו-JavaScript.",
			image: "img/timer.webp",
			path: "js-projects/timer/",
			zip: "js-projects/timer.zip",
			languages: ["HTML", "CSS", "JavaScript"],
		},
		{
			title: "בונה דפים",
			description: "אפליקציה המאפשרת יצירת דפי אינטרנט בצורה אינטראקטיבית. המשתמש יכול לעצב וליצור דפים בקלות. הנתונים נשמרים בזיכרון המקומי (localStorage) להמשך עבודה. נבנה ב-HTML, CSS ו-JavaScript.",
			image: "img/pageBuilder.webp",
			path: "js-projects/pageBuilder/",
			zip: "js-projects/pageBuilder.zip",
			languages: ["HTML", "CSS", "JavaScript"],
		},
	],
};

function sanitizeProjects(data) {
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const result = {};
	for (const [category, list] of Object.entries(data)) {
		if (!Array.isArray(list)) return null;
		const cleanedList = [];
		for (const item of list) {
			if (!item || typeof item !== "object") return null;
			const title = String(item.title ?? "").trim().slice(0, 200);
			const path = String(item.path ?? "").trim().slice(0, 300);
			if (!title || !path) return null;
			const description = String(item.description ?? "").trim().slice(0, 1000);
			const image = String(item.image ?? "").trim().slice(0, 300);
			const languages = Array.isArray(item.languages)
				? item.languages.map(l => String(l).trim().slice(0, 50)).filter(Boolean)
				: [];
			const cleaned = { title, description, image, path, languages };
			if (item.zip != null) cleaned.zip = String(item.zip).trim().slice(0, 300);
			cleanedList.push(cleaned);
		}
		result[category] = cleanedList;
	}
	return result;
}

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

function json(data, status = 200, extraHeaders = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
	});
}

function isAuthorized(request, env) {
	const provided = request.headers.get("x-edit-password") || "";
	return env.EDIT_PASSWORD && provided === env.EDIT_PASSWORD;
}

// True whenever the caller attempted to authenticate at all (header present, right or
// wrong) - as opposed to a plain anonymous request that never sent the header. Lets GET
// /api/links tell "wrong password" (401) apart from "no password given" (public data).
function attemptedAuth(request) {
	return request.headers.get("x-edit-password") != null;
}

function sanitizeLink(item) {
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
	const description = String(item.description ?? "").trim().slice(0, 300);
	return { id, name, url, description };
}

function sanitizeLinks(list) {
	if (!Array.isArray(list)) return null;
	const cleaned = [];
	for (const item of list) {
		const link = sanitizeLink(item);
		if (!link) return null;
		cleaned.push(link);
	}
	return cleaned;
}

function sanitizeSections(sections) {
	if (!Array.isArray(sections)) return null;
	const cleaned = [];
	for (const section of sections) {
		if (!section || typeof section !== "object") return null;
		const name = String(section.name ?? "").trim().slice(0, 100);
		if (!name) return null;
		const id = String(section.id ?? crypto.randomUUID()).slice(0, 100);
		const isPrivate = Boolean(section.private);
		const links = sanitizeLinks(section.links ?? []);
		if (links === null) return null;
		cleaned.push({ id, name, private: isPrivate, links });
	}
	return cleaned;
}

// A section-less deployment (or a bare legacy array still in KV) is normalized into one
// non-private section on read, so nothing needs a one-time migration step to keep working.
const DEFAULT_SECTIONS = [{ id: "default", name: "קישורים", private: false, links: DEFAULT_LINKS }];

function normalizeToSections(raw) {
	if (raw == null) return DEFAULT_SECTIONS;
	if (Array.isArray(raw)) {
		return [{ id: "default", name: "קישורים", private: false, links: sanitizeLinks(raw) ?? [] }];
	}
	if (raw && Array.isArray(raw.sections)) return raw.sections;
	return DEFAULT_SECTIONS;
}

async function handleGetLinks(request, env, ctx) {
	if (isAuthorized(request, env)) {
		// Authorized reads never return private sections to an anonymous caller, so this
		// path always reads KV directly rather than risk sharing a response cached for one.
		const stored = await env.LINKS.get(LINKS_KEY, "json");
		const sections = normalizeToSections(stored);
		return json({ sections }, 200, { ...corsHeaders(), "cache-control": "private, no-store" });
	}

	// A password was supplied but didn't match - reject outright rather than silently
	// falling back to the public view, so the editor can tell "wrong password" apart
	// from "no password" instead of quietly opening with only public data.
	if (attemptedAuth(request)) return json({ error: "unauthorized" }, 401);

	// Reads KV directly on every request rather than fronting it with the Workers edge
	// cache (caches.default): that cache is colo-local with no cross-colo purge, so a save
	// stayed invisible to most of the world for up to LINKS_CACHE_CONTROL's max-age. KV
	// itself already propagates globally in seconds, so a save is visible everywhere
	// immediately without needing this extra, harder-to-invalidate layer.
	const stored = await env.LINKS.get(LINKS_KEY, "json");
	const sections = normalizeToSections(stored).filter(s => !s.private);
	return json({ sections }, 200, { ...corsHeaders(), "cache-control": LINKS_CACHE_CONTROL });
}

async function handleSaveLinks(request, env, ctx) {
	if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid json" }, 400);
	}
	const cleaned = sanitizeSections(body.sections);
	if (!cleaned) return json({ error: "invalid sections" }, 400);
	await env.LINKS.put(LINKS_KEY, JSON.stringify({ sections: cleaned }));
	return json({ ok: true, sections: cleaned });
}

async function handleGetProjects(request, env, ctx) {
	// See handleGetLinks - reads KV directly rather than through caches.default so a save
	// is visible everywhere immediately instead of staying colo-stale for up to a day.
	const stored = await env.LINKS.get(PROJECTS_KEY, "json");
	return json(stored ?? DEFAULT_PROJECTS, 200, { ...corsHeaders(), "cache-control": PROJECTS_CACHE_CONTROL });
}

async function handleSaveProjects(request, env, ctx) {
	if (!isAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid json" }, 400);
	}
	const cleaned = sanitizeProjects(body);
	if (!cleaned) return json({ error: "invalid projects" }, 400);
	await env.LINKS.put(PROJECTS_KEY, JSON.stringify(cleaned));
	return json({ ok: true, projects: cleaned });
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
	let icon = null;
	let description = null;
	try {
		// No cf.cacheEverything/cacheTtl here on purpose: this is an authenticated
		// editor-preview action (see isAuthorized above), called rarely, where the whole
		// point is showing the target site's *current* metadata right after it changes -
		// a Cloudflare edge cache keyed to the URL previously got stuck for up to an hour
		// (once even caching a broken mid-deploy response), with no way to purge it since
		// the target is often a *.workers.dev URL outside this project's own zone.
		const resp = await fetch(parsed.toString(), {
			redirect: "follow",
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
		});
		const contentType = resp.headers.get("content-type") || "";
		if (contentType.includes("text/html")) {
			const html = await readBounded(resp, 100_000);
			const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
			if (match) title = decodeHtmlEntities(match[1].trim());
			icon = extractIconHref(html, resp.url);
			description = extractMetaDescription(html);
		}
	} catch {
		// ignore fetch failures, fall back to hostname
	}

	if (!title) title = parsed.hostname.replace(/^www\./, "");

	const favicon = icon ?? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(parsed.hostname)}.ico`;
	return json({ title, favicon, description });
}

// Public, read-only favicon lookup used by the public projects page: it parses the
// target site's own <link rel="icon"> so we show its real logo instead of a guess.
async function handleFavicon(request) {
	const targetUrl = new URL(request.url).searchParams.get("url") || "";
	let parsed;
	try {
		parsed = new URL(targetUrl);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
	} catch {
		return new Response(null, { status: 400 });
	}

	let iconUrl = null;
	try {
		const resp = await fetch(parsed.toString(), {
			redirect: "follow",
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
			cf: { cacheTtl: 86400, cacheEverything: true },
		});
		const contentType = resp.headers.get("content-type") || "";
		if (contentType.includes("text/html")) {
			const html = await readBounded(resp, 100_000);
			iconUrl = extractIconHref(html, resp.url);
		}
	} catch {
		// ignore fetch failures, respond 404 below so the client falls back
	}

	if (!iconUrl) return new Response(null, { status: 404 });

	// data: URIs (e.g. an inline SVG favicon) can't be used as a redirect target -
	// browsers block that as an unsafe redirect - so serve the decoded bytes directly.
	if (iconUrl.startsWith("data:")) {
		const dataResponse = dataUriToResponse(iconUrl);
		return dataResponse ?? new Response(null, { status: 404 });
	}

	if (!iconUrl.startsWith("http:") && !iconUrl.startsWith("https:")) {
		return new Response(null, { status: 404 });
	}

	return new Response(null, {
		status: 302,
		headers: { location: iconUrl, "cache-control": "public, max-age=3600" },
	});
}

// Decodes a data: URI (base64 or percent-encoded) into a Response with the right content-type.
function dataUriToResponse(dataUri) {
	const match = dataUri.match(/^data:([^;,]*)(;base64)?,([\s\S]*)$/);
	if (!match) return null;
	const mime = match[1] || "text/plain";
	const isBase64 = Boolean(match[2]);
	try {
		const bytes = isBase64
			? Uint8Array.from(atob(match[3]), c => c.charCodeAt(0))
			: new TextEncoder().encode(decodeURIComponent(match[3]));
		return new Response(bytes, {
			status: 200,
			headers: { "content-type": mime, "cache-control": "public, max-age=3600" },
		});
	} catch {
		return null;
	}
}

// Reads at most maxBytes of a response body as text - keeps a hostile/huge
// page from making the worker read an unbounded amount of HTML.
async function readBounded(resp, maxBytes) {
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
	const buffer = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.length;
	}
	return new TextDecoder().decode(buffer);
}

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

// Public, read-only thumbnail lookup used by the public projects page: it prefers the
// target site's own <meta property="og:image"> (what the site itself wants shown when
// shared/linked), and falls back to an mshots-generated screenshot when absent.
async function handleThumbnail(request) {
	const targetUrl = new URL(request.url).searchParams.get("url") || "";
	let parsed;
	try {
		parsed = new URL(targetUrl);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
	} catch {
		return json({ error: "invalid url" }, 400);
	}

	let ogImage = null;
	let description = null;
	try {
		const resp = await fetch(parsed.toString(), {
			redirect: "follow",
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
			cf: { cacheTtl: 3600, cacheEverything: true },
		});
		const contentType = resp.headers.get("content-type") || "";
		if (contentType.includes("text/html")) {
			const html = await readBounded(resp, 100_000);
			ogImage = extractOgImage(html, resp.url);
			description = extractMetaDescription(html);
		}
	} catch {
		// ignore fetch failures, fall back to mshots below
	}

	const url = ogImage ?? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(parsed.toString())}?w=400&h=250`;
	return json({ url, description }, 200, {
		...corsHeaders(),
		"cache-control": "public, max-age=3600",
	});
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
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === "/api/links") {
			if (request.method === "GET") return handleGetLinks(request, env, ctx);
			if (request.method === "PUT") return handleSaveLinks(request, env, ctx);
			if (request.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: { ...corsHeaders(), "access-control-allow-methods": "GET, PUT" } });
			}
			return json({ error: "method not allowed" }, 405);
		}

		if (url.pathname === "/api/projects") {
			if (request.method === "GET") return handleGetProjects(request, env, ctx);
			if (request.method === "PUT") return handleSaveProjects(request, env, ctx);
			if (request.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: { ...corsHeaders(), "access-control-allow-methods": "GET, PUT" } });
			}
			return json({ error: "method not allowed" }, 405);
		}

		if (url.pathname === "/api/check-password" && request.method === "POST") {
			return handleCheckPassword(request, env);
		}

		if (url.pathname === "/api/meta" && request.method === "GET") {
			return handleMeta(request, env);
		}

		if (url.pathname === "/api/favicon" && request.method === "GET") {
			return handleFavicon(request);
		}

		if (url.pathname === "/api/thumbnail" && request.method === "GET") {
			return handleThumbnail(request);
		}

		return env.ASSETS.fetch(request);
	},
};
