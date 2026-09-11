# Plan: `joris.wtf` infinite project field (Astro + Svelte + Sanity)

Dark, sparse, Phantasm-adjacent. No traditional portfolio IA. The page *is* the skill demo.

**Current phase: 2 — Sanity + live data.** Phase 1 frontend is approved.

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| First load | Entire project set is the ordered primary board (virtualize DOM; fill viewport + overscan buffer) |
| Sort (v1) | By title, case-insensitive; ignore leading **the** (see open question on **a/an**) |
| Custom order | Optional later via Sanity `sortOrder` |
| After primary set | Tile pool infinitely; cells outside primary board use seeded random |
| Tile size | Fluid; legible on mobile; respect ultrawide |
| Overscan | Partly visible rows top/bottom and columns left/right |
| Pan | Free 2D with inertia |
| Link target | Configurable; **new tab default** |
| Deep links | None for now — tile links go straight to project URL |
| Images | One source image + responsive `srcset` (not dual uploads) |
| Hosting | Prefer Cloudflare Workers + Assets (existing Worker ecosystem); Vercel also OK |
| Sanity | Project `elkf1eqd`, dataset `production`. Standalone Studio in `studio/`; `web/src/lib/content.ts` is the only fetch site |
| Scope | Design + architecture + build, with hard approval gates between phases |

### Open confirm (sort)

Strip only leading **“the ”**, or also **“a ” / “an ”**?

---

## Delivery gates

Work is sequential. A phase is not done when the code exists — it is done when the pass below is complete and **explicitly approved**.

| Phase | What ships | Approval required before |
|-------|------------|--------------------------|
| **1. Design / a11y / SEO / responsive** | Full FE on mock data + WebP placeholders | Phase 2 (Sanity) |
| **2. Sanity + live data** | CMS, API, real images, Lighthouse, tests rerun | Phase 3 (staging) |
| **3. Staging** | Cloudflare staging deploy | Production (later) |

Do not deploy staging until Phase 2 is signed off.

---

## 1. Design

**Feel:** near-black ground, low-contrast type, spectral / quiet motion (inertia, not bounce). No hero, no About, no section labels. Reference: Phantasm.

**Apex UI**

- Full-viewport field (overscroll contained)
- Tiles: thumbnail + title; 1-line description optional (e.g. on focus/hover only — keep sparse)
- **Overscan:** on first paint, partly visible row above/below and column left/right so the edge reads as “more exists”
- Corner chrome only if needed: e.g. tiny `li` — otherwise nothing
- `prefers-reduced-motion`: cut inertia / long tweens; keep pan + links

**Tile sizing (fluid)**

- Target: readable title on small phones; don’t become postage stamps on ultrawide
- Approach: `min` / `max` tile width from viewport, column count = `floor(availableWidth / tileWidth)`, row height from aspect ratio + text block
- Exact clamp values: tune in Phase 1 against placeholders, then re-tune in Phase 2 against real thumbnails

---

## 2. Architecture

```
studio/  Sanity Studio (standalone)
web/     Astro SSG + Svelte island
    → HTML contract unchanged
```

| Layer | Responsibility |
|-------|----------------|
| **Content gateway** (`web/src/lib/content.ts`) | Only place that loads projects **and site SEO**. Sanity is required; missing content fails the build |
| **Astro** | Render SEO HTML; dark shell |
| **Svelte island** | Layout math, virtualization, pan/inertia, keyboard, random tiling after primary set |
| **Images** | Sanity Image CDN `srcset` (one source + width variants, hotspot crop) |

**Progressive enhancement**

1. SSR: semantic list/grid of all projects (links work with no JS)
2. JS: hydrate island, measure viewport, build world; list remains in the document for crawlers (`inert` + `aria-hidden` after hydrate)
3. Crawlers/SR: HTML list on first paint; after hydrate, skip link and keyboard land on the field

**No deep links** for now — tile URL = project URL only.

---

## 3. Sanity (new personal project) — Phase 2

Studio lives in `studio/` (standalone, not embedded). Dataset: `production` (public). Build-time fetch via `web/src/lib/content.ts`. Sanity is required: missing `siteSettings` or no published projects fails `astro build`. In dev, the homepage shows a content-unavailable message.

**Commands:** `npm run studio` (localhost:3333), `npm run seed` from `studio/` (needs a write token).

**Document type: `project`**

| Field | Type | Notes |
|-------|------|--------|
| `title` | string | Required |
| `slug` | slug | Internal id only for now (future `/p/[slug]`) |
| `url` | url | Required — destination |
| `openInNewTab` | boolean | **Default: true** |
| `thumbnail` | image | Hotspot enabled |
| `thumbnailAlt` | string | Required for a11y |
| `description` | text | Optional; max ~1 sentence |
| `sortOrder` | number | Optional; **unused in v1 UI sort**, reserved for later |

**Document type: `siteSettings` (singleton)**

One document for the apex site — not per-project. Include an **SEO** fieldset/section that maps 1:1 to `SiteSeo`:

| Field | Type | Notes |
|-------|------|--------|
| `title` | string | Document `<title>` |
| `description` | text | Meta description |
| `siteName` | string | `og:site_name`, JSON-LD `WebSite.name` |
| `ogTitle` | string | Share title (defaults to `title` if empty) |
| `ogDescription` | text | Share description (defaults to `description` if empty) |
| `ogImage` | image | Required for sharing; ~1200×630; hotspot optional |
| `ogImageAlt` | string | Required |
| `twitterCard` | string | `summary` \| `summary_large_image` |
| `locale` | string | BCP 47, e.g. `en` |

JSON-LD (`WebSite` + homepage `ItemList`) is **derived in the app** from `siteSettings` + the project list. Do not store raw JSON-LD in Studio.

**v1 sort rule (in app, not Studio):**  
case-insensitive title sort; ignore leading `the ` (and possibly `a `/`an ` — confirm).

**Later:** if `sortOrder` is in use, prefer that; else fall back to title rule.

---

## 4. Image strategy

**Decision: one image + responsive `srcset` (no separate mobile upload).**

| Approach | Load behavior | When to use |
|----------|---------------|-------------|
| **Single image + width variants** | Browser picks **one** URL from `srcset` | Default — this project |
| Separate mobile/desktop assets + `<picture>` | Still **one** downloaded image | Only if **art direction** (different crop/composition) |

**Phase 1:** generated local WebP placeholders at `320, 480, 640, 960` in `public/images/placeholders/`.

**Phase 2:** same widths via Sanity CDN (`format=webp`, quality capped, hotspot crop). `sizes` ≈ tile display width.

**Mobile**

- Prefer smaller max width in `sizes` on narrow viewports
- Lazy-load tiles outside the near viewport (virtualization)
- LQIP/blur optional later — not required for v1

---

## 5. World model & load order

### Primary board (ordered, once)

1. Sort all projects (title rule above).
2. Compute `cols` from viewport + tile min/max.
3. `rows = ceil(n / cols)` for **n = total projects**.
4. Place **entire set** in row-major order on a **primary board** (one cell → one project).
5. Position board so viewport is filled **and** overscan shows partial tiles on all four sides.
6. **Pre-mount / buffer:** virtualize, but keep a margin of cells beyond the viewport ready for fast pans.

Even with a large dataset, the **logical** first cycle is the full ordered set; DOM only mounts cells near the camera.

### Beyond the primary board (infinite)

- Tile the pool **ad infinitum**.
- Any cell **outside** the primary board: assign project via **seeded RNG** from `cellX, cellY` (stable under pan — same cell = same project after reload).
- Do **not** start random repeats until the primary board has been fully assigned the ordered set (random only for cells outside that board).

### Virtualization

- Spatial index: visible bounds + overscan → list of cell keys
- Mount only those tiles
- Recycle components where possible

---

## 6. Interaction (Svelte island)

| Input | Behavior |
|-------|----------|
| Pointer / touch | Free 2D pan |
| Release | Inertia decay; stop on low velocity |
| Wheel | Pan the field (page does not scroll) |
| Click / tap tile | Follow `url`; `target=_blank` + `rel` if `openInNewTab` |
| Keyboard | Focusable tiles; arrows move focus between neighbors; Enter/Space activate; skip link to list (no JS) / field (after hydrate) |
| Reduced motion | No/weak inertia |

**Touch:** one-finger pan; don’t fight vertical browser chrome; test iOS Safari. If pan fights scroll, use an explicit grab surface (the field is the page).

---

## 7. Astro HTML contract (SEO / a11y / no-JS)

SSR output includes:

- Document title / meta (sparse, accurate); Open Graph + Twitter image; JSON-LD `WebSite` + homepage `ItemList`
- Full list of projects as `<a href="…">` (title + optional description + img alt)
- `rel="noopener noreferrer"` when new tab
- Landmark / label for the list (visually minimal)
- After hydrate: island may visually replace list but **keep** the list in the HTML for crawlers

**WCAG 2.2 AA targets:** focus visible, contrast, target size, motion, keyboard operability, name/role/value for links, alt text.

**SEO / AI SEO:** real HTML links + text; JSON-LD `WebSite` + homepage `ItemList` from site SEO + projects; sitemap = apex only for now (no deep links). Canonical = apex.

---

## 8. Hosting

Prefer staying on **Cloudflare**:

- **Workers + Assets** (not new Pages projects)
- Phase 1–2: static/SSG is enough (Astro prerender)
- Sanity: build-time fetch first; runtime fetch with revalidation later if needed

**Vercel** remains fine if preferred; not required.

**Secrets:** Sanity project id + dataset + read token (if dataset private) via CF env — Phase 2 only.

Staging (Phase 3) is a separate Workers environment / preview, not production `joris.wtf`.

---

## 9. Stack (maps to LinkedIn skills)

- Astro + Svelte 5 island
- TypeScript
- Sanity CMS + image CDN (Phase 2)
- CSS (custom dark tokens)
- Playwright + axe (a11y)
- Vitest for sort / world math
- CI on push (GitHub Actions)
- Lighthouse desktop + mobile (Phase 2 gate)

Optional later: Storybook for `Tile` — not blocking v1.

---

## 10. Build phases

### Phase 1 — Design, accessibility, SEO, responsiveness (mock data)

**Build**

- Astro app, dark Phantasm-adjacent shell, Cloudflare-ready static output
- Mock projects in `src/data/projects.ts` (Sanity-shaped)
- Mock site SEO in `src/data/seo.ts` (`siteSettings` SEO section)
- Local WebP placeholders (`srcset` widths)
- SSR HTML list of every project (sorted) for no-JS / crawlers
- Svelte island: fluid columns, primary board, overscan, pan + inertia, virtualization, infinite seeded tiles
- Keyboard map, skip link (list without JS; field after hydrate), `prefers-reduced-motion`, visible focus

**Test pass (required)**

- Design: sparse field, overscan readable on phone and ultrawide, hover/focus description does not clutter
- Accessibility: axe (WCAG 2.2 AA tags), keyboard path, contrast, target size, reduced motion, no-JS list
- SEO: title, description, canonical, `og:image` / Twitter image, JSON-LD, real `<a>` links, alt text, sitemap/robots, new-tab `rel`
- Responsiveness: mobile, tablet, desktop; tiles stay legible; pan does not fight layout

**Gate:** full approval of Phase 1. No Sanity project, no API tokens, no staging deploy until this is signed off.

### Phase 2 — Sanity, real data, performance

**Build**

- Create Sanity project + `project` schema + `siteSettings` singleton (SEO section required)
- Connect via `web/src/lib/content.ts` only (`getProjects`, `getSiteSeo`)
- Replace mock documents with real ones (seed: Autobahn, DR-101, Juno, Kijkdoos, Mobey Run, Phantasm, LinkedIn, Ell Creative, optional extras)
- Sanity images + CDN `srcset` / hotspot; no local placeholder fallback

**Test pass (required)**

- Re-run unit tests + Playwright/axe
- Performance and SEO on the live data build
- **Lighthouse for both desktop and mobile** (CWV, a11y, SEO, best practices)
- Re-check image `sizes`, lazy/eager loading, and field smoothness with real thumbnails

**Gate:** full approval of Phase 2 (including Lighthouse) before staging.

### Phase 3 — Staging

- Deploy the Phase 2 build to a Cloudflare Workers staging environment
- Point a staging hostname (not apex `joris.wtf`)
- Smoke the field, links, and images on staging
- Production cutover is out of scope until staging is approved

### Polish (can run inside a phase, not a skip-ahead)

- Tune clamps, overscan, inertia
- Edge cases: 1 project, 100+ projects, ultrawide, empty dataset

---

## 11. Gaps closed

| Gap | Plan handling |
|-----|----------------|
| SEO / no-JS | Astro HTML list first |
| Infinite × a11y | HTML links + keyboard grid after hydrate |
| Mobile images | One asset + `srcset` (placeholders, then Sanity CDN) |
| Mystery | No bio/sections; equal “project” tiles |
| Fast grab | Overscan + buffer mount |
| CMS risk | Mock FE approved before Sanity exists |

---

## Seed content (initial projects)

Treat all as equal `project` documents, e.g.:

- Autobahn, DR-101, Juno, Kijkdoos, Mobey Run, Phantasm
- LinkedIn
- Ell Creative site
- Optional: old YouTube video, GitHub, etc.

Phase 1 uses this list as local mock data. Phase 2 enters the same items in Sanity.
