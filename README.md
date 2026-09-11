# joris.wtf

Infinite project field. Dark, sparse, Phantasm-adjacent. Astro + Svelte 5, hosted on Cloudflare Workers.

See [PLAN.md](./PLAN.md) for architecture and gated phases.

## Phase 1

The site runs on **local mock data** (`src/data/projects.ts`) and **WebP placeholders**. Sanity is Phase 2, after a full design / accessibility / SEO / responsive approval.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the build |
| `npm run check` | Astro + Svelte typecheck |
| `npm run test:unit` | World/sort unit tests |
| `npm test` | Playwright + axe (desktop and mobile) |
| `npm run generate:placeholders` | Rebuild local WebP placeholders |
| `npm run deploy` | Build and deploy with Wrangler (staging/production later) |

## Content swap

All project loading goes through `src/lib/content.ts`. Phase 2 replaces that module with Sanity; the page and field island stay the same.
