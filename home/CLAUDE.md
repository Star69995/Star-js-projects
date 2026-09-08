# home/ - star-projects-home

Cloudflare Worker + static assets. See `README.md` for the data model, API surface,
and editor architecture.

## Project-specific notes

- `wrangler.jsonc`'s `LINKS` KV namespace is configured `"remote": true`, so
  `wrangler dev` reads/writes **real production data** by default. When testing writes
  locally, snapshot the current data first (authenticated `GET /api/links`) and restore
  it afterward rather than leaving throwaway test data in production KV.
- `.dev.vars` holds the real `EDIT_PASSWORD` secret - never print/cat it. If you need to
  drive the editor's password-gated UI for testing, swap in a known throwaway value
  (back up `.dev.vars` first, restore it after) rather than reading the real one.
- `home/public/service-worker.js` is network-first for everything except `/api/*`
  (never cached) - no cache-version bump needed when editing `public/` files.

## Web UI rules

Apply only in projects with a browser-based user interface (this one qualifies).

- Use `-` (hyphen), never `—` (em dash), in UI copy/text.
- Minimum text size: 12px. Layout must stay usable down to a 320px viewport width.
- Focusable fields (`input`, `textarea`, `select`) need `font-size: 16px` or larger - this overrides the 12px minimum above. Below 16px, iOS Safari zooms the page in when the field gets focus, and that zoom shifts the visual viewport, so sticky/fixed bars drift off screen and the user has to pinch back out. Never solve it with `user-scalable=no` or a permanent `maximum-scale=1` in the viewport meta: Safari ignores the former anyway, and both block pinch-zoom for everyone for the whole visit. If a field genuinely must show smaller text, add `maximum-scale=1` to the viewport meta on `focusin` and remove it on `focusout`.
- **iOS Safari's on-screen keyboard shrinks and offsets the *visual* viewport without touching the *layout* viewport, and doesn't fire `visualViewport` events continuously during its own open/close animation** - any sticky/fixed bar (header, toolbar, action bar) can drift off-screen or end up hidden behind the keyboard. This does not reproduce in a desktop browser or in the iOS Simulator's software keyboard - it needs a real device to test. Extensively tested across many real-device approaches, on a page with a *stack* of several sticky bars (not just one): the fix that looks obvious - give each bar its own `transform`/`top` that chases `window.visualViewport.offsetTop` - is fragile once there's more than one bar. It breaks in different ways depending on the exact implementation: z-index ordering between the bars becomes load-bearing and easy to get backwards (a bar with no explicit `z-index` silently paints *underneath* a sibling that has one, even if it's later in the DOM), and WebKit can glitch-repaint (a bar flickers transparent/disappears) even with a permanently-applied `transform` meant to keep it on a stable GPU layer. The approach that held up cleanly, repeatedly: don't move each bar - make the **app's own outer shell** the thing that tracks the keyboard. Give the shell `position: fixed` with its `top` and `height` bound to CSS variables kept in sync with `visualViewport.offsetTop` and `visualViewport.height` (a `resize`/`scroll` listener on `window.visualViewport`, refreshed every frame via `requestAnimationFrame` for as long as a field has focus - listeners alone leave the frame visibly lagging behind the keyboard's open/close animation). With the shell's own geometry always matching what's actually visible, everything inside it - header, sticky toolbars - can use plain normal-flow/sticky positioning with no per-element `transform` or `top` hacks at all: there's nothing to chase, so there's no overlap or stacking-order question to get wrong. Separately, and just as easy to miss: scroll the newly-focused field into view **on focus**, not only once the user starts typing - a field near the bottom of scrollable content can end up hidden under the keyboard the instant it opens, before any keystroke, and no browser does this for you automatically inside a custom scroll container.
- No emoji in UI elements - use an icon library or SVG instead.
- Every site needs Open Graph + Twitter Card meta tags in `<head>` (`og:title`, `og:description`, `og:image`, `og:url`, `og:image:width`/`height`, `twitter:card` set to `summary_large_image`), pointing at an absolute image URL. The preview image (1200x630) must be an actual screenshot of the site/app in use, taken from a running instance (dev server or deployed site) - not a designed/illustrated graphic and not a logo or title card with no real UI in it. Resize/crop the raw screenshot to fit; don't composite it into invented artwork. To get that screenshot:
  1. Start a dev server yourself and open the app in a browser tool.
  2. If the page is empty/blank by default (no seed data), fill in a few fields with realistic-looking demo content first, so the screenshot represents actual use rather than an empty form. Don't persist this anywhere real - it's only for the screenshot.
  3. Pick a state that's actually representative of the product, not just whatever the default view happens to render. If the UI varies by real-world context (time of day, date, etc.), deliberately set it to a meaningful state (e.g. override `Date` in the page via the browser tool) rather than settling for whatever the literal current moment produces.
  4. Capture the screenshot directly at (or cropped/resized to) the target dimensions (1200x630) - don't composite a differently-shaped screenshot into a designed frame.
  5. Clean up: close the browser page/tab and stop the dev server you started.
