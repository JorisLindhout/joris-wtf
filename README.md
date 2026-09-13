# joris.wtf

Infinite project field. Dark, sparse, Phantasm-adjacent.

[joris.wtf](https://joris.wtf) — Astro + Svelte 5 on Cloudflare Workers, content from Sanity.

- `web/` — the field
- `studio/` — standalone Sanity Studio (not embedded)

## Setup

Node 22.12+. The two packages install separately (no workspaces):

```bash
cd web && npm ci
cd ../studio && npm ci   # only needed for Studio
```

Copy `web/.env.example` to `web/.env`. The `PUBLIC_*` values are identifiers, not secrets. The site reads live Sanity data only — there is no local mock fallback.

## Commands

From the repo root (after installing in `web/` / `studio/`):

| Command | Action |
| --- | --- |
| `npm run dev` | Astro app at `localhost:4321` |
| `npm run studio` | Sanity Studio at `localhost:3333` |
| `npm run build` | Production build (`web/dist`) |
| `npm run preview` | Preview the production build |
| `npm run check` | Astro + Svelte typecheck |
| `npm run test:unit` | Unit tests (world, SEO, slugs) |
| `npm test` | Playwright + axe |
| `npm run deploy` | Build and deploy with Wrangler |

`npm test` needs Playwright Chromium first: `cd web && npx playwright install chromium`.

## Content

All fetching goes through `web/src/lib/content.ts`. Missing `siteSettings` or an empty published project list fails `astro build`. In `astro dev`, the homepage shows a content-unavailable message instead.

Studio is `npm run studio`. Types: `npm run typegen` (writes `web/sanity.types.ts`). `npm run seed` upserts documents and keeps existing images; it needs `SANITY_API_WRITE_TOKEN` in `studio/.env` (gitignored). New projects need a thumbnail in Studio first.

Publishing in Studio rebuilds production. A Sanity webhook (`cloudflare-rebuild`) POSTs to a Cloudflare Workers Builds Deploy Hook (`sanity-content` on `main`). That rebuilds the current `main` SHA with a fresh Sanity fetch — no git commit. Code still deploys on push to `main`. Local `npm run deploy` is a manual override.

The Deploy Hook URL is the credential. Keep it in Sanity’s webhook settings only; never commit it. Draft edits should not trigger a rebuild.

## URLs

`/` is the field. Each published project is also `https://joris.wtf/{slug}` — same field, that project’s first-board tile centered and focused. The HTML list links to those paths; field tiles still go to the project’s destination URL.

After a pan settles, or when a tile is focused (Tab / arrows), the address bar `replaceState`s to `/{slug}`. No extra history entry, and the document title stays put until a real load. Refresh always recenters the primary cell. `/` is left alone until the user actually moves.

`/sitemap-0.xml` lists `/` and every project page. `/llms.txt` is the same list for agents (`robots.txt` points at it). Unknown paths 404 with `noindex`. Extra public URLs go in `web/src/lib/seo.ts` (`sitemapXml` / `llmsTxt`). Project slugs cannot shadow those files — the denylist lives in `web/src/lib/slugs.ts` and Studio.
