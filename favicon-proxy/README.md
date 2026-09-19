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

## Deploying

```
cd favicon-proxy
vercel link      # first time only, links this directory to a Vercel project
vercel --prod    # deploy
```

No environment variables or build step needed.
