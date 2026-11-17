# favicon-proxy

Tiny Vercel-hosted proxy for `/api/favicon` and `/api/thumbnail`, used by
[star-projects-home](../home) to look up the real favicon / og:image of a linked site.

It exists as a separate, non-Cloudflare deployment because a Cloudflare Worker fetching
another `*.workers.dev` site is blocked by Cloudflare itself with "error 1042" - see
[home/src/worker.js](../home/src/worker.js)'s `handleFavicon`/`handleThumbnail` (and the
comment on `handleMeta`) for the full story. A plain server fetching the same URL isn't
subject to that restriction, so the same extraction logic lives here instead.

## Endpoints

- `GET /api/favicon?url=<encoded target URL>` - 302s to the target's real favicon, or 404
  if none was found.
- `GET /api/thumbnail?url=<encoded target URL>` - returns `{ url, description }`, where
  `url` is the target's `og:image` (or an mshots screenshot fallback) and `description`
  is its `og:description`/`description` meta tag.

## Security restrictions

All endpoints are public, so target URLs are restricted to keep them from being used to
reach anything internal (SSRF):

- Only `http:`/`https:` on the default port, with no `user:pass@` credentials.
- The host must resolve only to public addresses - loopback, private (RFC 1918),
  link-local (incl. `169.254.169.254` cloud metadata), CGNAT, multicast and reserved
  ranges are refused, as are `localhost`/`*.local`/`*.internal`.
- Redirects are followed by hand (max 5) and every hop is re-checked; the whole lookup
  times out after 8s and reads at most 100KB of HTML.
- A `data:` favicon is only served if its MIME type is an image, with `nosniff` and a
  sandboxing CSP - never as `text/html`, which would run the target page's script here.

## Deploying

```
cd favicon-proxy
vercel link      # first time only, links this directory to a Vercel project
vercel --prod    # deploy
```

No environment variables or build step needed.
