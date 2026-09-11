# joris.wtf

Infinite project field. Dark, sparse, Phantasm-adjacent.

Monorepo:

- `web/` — Astro + Svelte 5 field, Cloudflare Workers
- `studio/` — standalone Sanity Studio (not embedded)

See [PLAN.md](./PLAN.md) for architecture and gated phases.

## Commands

From the repo root:

| Command | Action |
| --- | --- |
| `npm run dev` | Astro app at `localhost:4321` |
| `npm run studio` | Sanity Studio at `localhost:3333` |
| `npm run build` | Production build (`web/dist`) |
| `npm run check` | Astro + Svelte typecheck |
| `npm run test:unit` | World/sort unit tests |
| `npm test` | Playwright + axe |
| `npm run deploy` | Build and deploy with Wrangler |

Or run the same scripts inside `web/` / `studio/`.

## Content

`web/src/lib/content.ts` is the only fetch site (`getProjects`, `getSiteSeo`). Copy `web/.env.example` to `web/.env`. The site reads live Sanity data only — there is no local mock or placeholder fallback.

Missing `siteSettings` or an empty published project list fails `astro build`. In `astro dev`, the homepage shows a content-unavailable message instead.

Studio is the `studio/` app. Local: `npm run studio` (localhost:3333). Hosted Sanity Studio is optional later: `cd studio && npx sanity deploy`.

After `npx sanity login`:

```bash
cd studio
npx sanity schemas deploy
npx sanity cors add http://localhost:4321 --credentials
cp .env.example .env   # add SANITY_API_WRITE_TOKEN (gitignored)
npm run seed
npm run typegen
```

`npm run seed` updates existing documents and keeps their images. New projects need a thumbnail uploaded in Studio first.
