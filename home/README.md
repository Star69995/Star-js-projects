# star-projects-home

Cloudflare Worker serving a personal "projects" landing page (`public/`) with a
password-gated, drag-and-drop editor for managing the link list. Links are grouped
into free-form **sections** (e.g. "small", "big/serious", "old", "personal use only"),
each of which can be flagged private to hide it from the public page entirely.

## Development

```
npm run dev      # wrangler dev (uses .dev.vars for EDIT_PASSWORD; KV is remote by default)
npm run deploy    # wrangler deploy
```

`wrangler.jsonc` configures the `LINKS` KV namespace with `"remote": true`, so
`wrangler dev` reads/writes the **real production KV data** unless you override that.
Be careful when testing writes locally.

## Data model

KV key `links` (namespace binding `LINKS`) stores:

```jsonc
{
  "sections": [
    {
      "id": "string",
      "name": "string",
      "private": false,       // true = hidden from the public page entirely
      "links": [
        { "id": "string", "name": "string", "url": "string", "description": "string" }
      ]
    }
  ]
}
```

A legacy bare-array value (the pre-sections format) is transparently normalized into a
single non-private section on read (`normalizeToSections` in `src/worker.js`) — no
manual migration needed. It's only rewritten to the new shape once the editor saves.

KV key `projects` (same namespace) stores an unrelated, category-keyed structure used
by the separate `/api/projects` endpoint (mirrors star-site's `projects.json`).

## API

All endpoints are served from `src/worker.js`. Authenticated endpoints require an
`x-edit-password` header matching the `EDIT_PASSWORD` secret (set in `.dev.vars`
locally, as a Worker secret in production).

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/links` | GET | optional | No `x-edit-password` header → public, edge-cached (`public, max-age=86400`) response with `private` sections filtered out entirely. Correct `x-edit-password` → full data (including private sections), `cache-control: private, no-store`, never touches the edge cache. **Wrong** password (header present but not matching) → `401`. |
| `/api/links` | PUT | required | Body `{ "sections": [...] }`. Validates/sanitizes and replaces the whole KV value, then purges the public GET's edge cache entry. |
| `/api/projects` | GET | none | Public, edge-cached. Unrelated category-keyed project showcase data (not sections/links). |
| `/api/projects` | PUT | required | Body is the category-keyed structure directly (not wrapped). |
| `/api/check-password` | POST | — | Returns `{ ok: boolean }` for the given `x-edit-password` header; used by the editor's unlock screen. |
| `/api/meta` | GET | required | `?url=` → `{ title, favicon, description }` scraped from the target page (`<title>`, `<link rel="icon">`, `og:description`/`meta[name=description]`). Powers the editor's "שאיבת שם" (fetch info) button, which fills in the name, favicon preview, and description together. |
| `/api/favicon` | GET | none | `?url=` → 302 redirect to the target site's own favicon (or a decoded `data:` response for inline SVG icons), 404 if none found. Public/read-only, used by both the editor and the public page. |
| `/api/thumbnail` | GET | none | `?url=` → `{ url, description }`: prefers the target's own `og:image`/description, falls back to an mshots screenshot. Public, edge-cached. |

### Cache safety for `/api/links` GET

The edge cache (Cache API) is keyed only by the request URL, with no `Vary` on
`x-edit-password`. To avoid ever serving private data publicly or a stale public
snapshot to the editor, the authorized and anonymous code paths are kept strictly
separate in `handleGetLinks`: only the anonymous (no-header) path ever reads from or
writes to `caches.default`, and it always filters out private sections *before*
computing the response that gets cached. Any request that sends the header (right or
wrong) bypasses the cache entirely.

## Editor UI

`public/script.js` renders two views from the same section data:

- **Grid** (`renderProjects`, `#projects-container`): one heading + card grid per
  non-empty section, sourced from `displaySections`. Anonymously this is
  `publicSections` from an anonymous `GET /api/links` (server-side filtered — the
  client never even receives private sections' contents). Once a stored
  `x-edit-password` has been verified (on load, on unlock, or after a save),
  `displaySections` is swapped for the full authenticated section list instead, so
  private sections render in the grid too (marked with a small "אישי" badge on the
  heading) rather than only being editable in the overlay below. Any 401 against the
  authenticated endpoint clears the stored password and reverts `displaySections` to
  `publicSections`.
- **Editor** (`renderSections`, `#sections-list`, inside the password-gated overlay):
  full section list fetched separately via an authenticated `GET /api/links`, with
  drag-and-drop (via a `.drag-handle`, implemented with Pointer Events rather than
  native HTML5 drag-and-drop - the native `dragstart`/`dragover`/`drop` events don't
  fire reliably on touch, so a Pointer Events based implementation is needed for the
  editor to be usable on a phone) to reorder links within a section, move links
  between sections, and reorder sections themselves. Each link row also has a
  refresh button that re-runs `/api/meta` against its current URL to re-scrape the
  name/description/favicon. Rename, delete, and toggle-private controls live on each
  section's header. Saving `PUT`s the whole edited section list.
- On viewports narrower than 700px the editor overlay (`#editor-panel`) becomes a
  true full-screen view with a sticky header (close button) and sticky footer (save
  button) around a scrolling middle section, and its own position/height are bound
  to `window.visualViewport` (see `initViewportTracking` in `script.js`) so the panel
  - and the sticky save button inside it - track the on-screen keyboard instead of
  drifting under it. See the web UI rules in `CLAUDE.md` for why this needs a real
  device to verify.

A link's optional description shows on the public card behind an "ⓘ" toggle when
present.
