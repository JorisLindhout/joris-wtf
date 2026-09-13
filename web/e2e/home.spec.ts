import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
	test('exposes SEO metadata and a full HTML project list', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1.content-error, .content-error')).toHaveCount(0);
		await expect(page).toHaveTitle(/.+/);
		await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://joris.wtf/',
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			'content',
			/cdn\.sanity\.io/,
		);
		await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
			'content',
			/cdn\.sanity\.io/,
		);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			'content',
			'summary_large_image',
		);

		const siteName = await page.locator('meta[property="og:site_name"]').getAttribute('content');
		expect(siteName).toBeTruthy();
		await expect(page.locator('link[rel="icon"][sizes="96x96"]')).toHaveAttribute(
			'href',
			'/favicon-96x96.png',
		);
		await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
			'href',
			'/favicon.svg',
		);
		await expect(page.locator('link[rel="shortcut icon"]')).toHaveAttribute('href', '/favicon.ico');
		await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
			'href',
			'/apple-touch-icon.png',
		);
		await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
			'content',
			siteName!,
		);
		await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', /.+/);
		await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
			'content',
			'yes',
		);
		await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
			'content',
			'black-translucent',
		);
		await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute(
			'content',
			'yes',
		);
		await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/site.webmanifest');

		const description = await page.locator('meta[name="description"]').getAttribute('content');
		const manifestResponse = await page.request.get('/site.webmanifest');
		expect(manifestResponse.ok()).toBe(true);
		expect(manifestResponse.headers()['content-type']).toMatch(/manifest\+json/);
		const manifest = (await manifestResponse.json()) as {
			name: string;
			short_name: string;
			description: string;
			icons: unknown[];
		};
		expect(manifest.name).toBe(siteName);
		expect(manifest.short_name).toBe(siteName);
		expect(manifest.description).toBe(description);
		expect(manifest.icons.length).toBeGreaterThan(0);

		const jsonLd = page.locator('script[type="application/ld+json"]');
		await expect(jsonLd).toHaveCount(1);
		const graph = JSON.parse((await jsonLd.textContent()) ?? '{}') as {
			'@graph': Array<Record<string, unknown>>;
		};
		expect(graph['@graph'][0]).toMatchObject({
			'@type': 'WebSite',
			url: 'https://joris.wtf/',
			author: {
				'@type': 'Person',
				url: 'https://joris.wtf/',
			},
		});
		expect(graph['@graph'][1]).toMatchObject({
			'@type': 'ItemList',
		});

		await expect(page.locator('html')).toHaveAttribute('data-enhanced', '');
		await expect(page.locator('#projects')).toHaveAttribute('aria-hidden', 'true');
		await expect(page.locator('.project-list')).toBeHidden();
		const homepageHtml = await (await page.request.get('/')).text();
		expect(homepageHtml).not.toMatch(/<script[^>]+src=["'][^"']*googletagmanager/);
		const fontFace = await page.evaluate(() => {
			for (const sheet of document.styleSheets) {
				try {
					for (const rule of sheet.cssRules) {
						if (!(rule instanceof CSSFontFaceRule)) continue;
						const family = rule.style.getPropertyValue('font-family');
						if (!/Atkinson Hyperlegible Next/i.test(family)) continue;
						const src = rule.style.getPropertyValue('src');
						const match = /url\(["']?([^"')]+)["']?\)/.exec(src);
						return {
							family,
							display: rule.style.getPropertyValue('font-display'),
							path: match ? new URL(match[1], location.href).pathname : null,
						};
					}
				} catch {
					/* cross-origin sheets */
				}
			}
			return null;
		});
		expect(fontFace).toBeTruthy();
		expect(fontFace!.family).toMatch(/^["']?Atkinson Hyperlegible Next["']?$/);
		expect(fontFace!.display).toBe('swap');
		expect(fontFace!.path).toMatch(/\.woff2$/);
		const fontResponse = await page.request.get(fontFace!.path!);
		expect(fontResponse.ok()).toBe(true);
		expect(fontResponse.headers()['content-type']).toMatch(/font|woff2/);
		await expect(page.locator('link[rel="preconnect"][href="https://cdn.sanity.io"]')).toHaveCount(
			1,
		);
		await expect(page.locator('link[rel="dns-prefetch"][href="https://cdn.sanity.io"]')).toHaveCount(
			1,
		);
		const preload = page.locator('link[rel="preload"][as="image"]');
		await expect(preload).toHaveCount(1);
		await expect(preload).toHaveAttribute('imagesizes', '(max-width: 727px) 160px, 280px');
		await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(0);
		const fontFamily = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
		expect(fontFamily).toMatch(/Atkinson Hyperlegible Next/);
		expect(fontFamily).not.toMatch(/Atkinson Hyperlegible Next-/);

		const list = page.locator('#projects a');
		const count = await list.count();
		expect(count).toBeGreaterThan(0);
		expect(graph['@graph'][1]).toMatchObject({
			numberOfItems: count,
		});

		const blankLinks = page.locator('#projects a[target="_blank"]');
		const blankCount = await blankLinks.count();
		expect(blankCount).toBeGreaterThan(0);
		for (let i = 0; i < blankCount; i += 1) {
			await expect(blankLinks.nth(i)).toHaveAttribute('rel', /noopener/);
		}

		const images = page.locator('#projects img');
		const imageCount = await images.count();
		expect(imageCount).toBe(count);
		for (let i = 0; i < imageCount; i += 1) {
			await expect(images.nth(i)).toHaveAttribute('src', /cdn\.sanity\.io/);
			await expect(images.nth(i)).toHaveAttribute('alt', /.+/);
			await expect(images.nth(i)).toHaveAttribute('loading', 'lazy');
		}

		await page.locator('.field .tile img').first().waitFor();
		await expect(page.locator('.field .tile img').first()).toHaveAttribute('loading', 'eager');
		await expect(page.locator('.field .tile[data-cell="0,0"] img')).toHaveAttribute(
			'fetchpriority',
			'high',
		);
	});

	test('has no serious axe violations on first paint', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		await page.locator('.field.ready .tile').first().waitFor();
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
			.analyze();
		expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
		const blocking = results.incomplete.filter((v) =>
			['aria-hidden-focus', 'skip-link', 'region'].includes(v.id),
		);
		expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
	});

	test('hydrates a pannable field with overscan tiles', async ({ page }) => {
		await page.goto('/');
		const field = page.locator('.field.ready');
		await expect(field).toBeVisible();
		await expect(page.locator('.field .tile').first()).toBeVisible();
		const listCount = await page.locator('#projects a').count();
		const tileCount = await page.locator('.field .tile').count();
		expect(tileCount).toBeGreaterThan(listCount / 2);

		await expect(page.locator('.field .tile').first()).toHaveRole('article');
		await expect(page.locator('.field .tile a').first()).toBeVisible();

		const overscan = await page.evaluate(() => {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const tiles = [...document.querySelectorAll('.field .tile')];
			const crosses = (edge: 'top' | 'right' | 'bottom' | 'left') =>
				tiles.some((tile) => {
					const r = tile.getBoundingClientRect();
					if (edge === 'top') return r.top < 0 && r.bottom > 16;
					if (edge === 'bottom') return r.top < vh - 16 && r.bottom > vh;
					if (edge === 'left') return r.left < 0 && r.right > 16;
					return r.left < vw - 16 && r.right > vw;
				});
			return {
				top: crosses('top'),
				right: crosses('right'),
				bottom: crosses('bottom'),
				left: crosses('left'),
			};
		});
		expect(overscan).toEqual({ top: true, right: true, bottom: true, left: true });

		const voidLayer = page.locator('.field .void');
		await expect(voidLayer).toBeAttached();
		await expect(page.locator('.field .wash')).toHaveCount(4);
		const far = page.locator('.field .wash.far');
		const near = page.locator('.field .wash.near');
		const farBefore = await far.evaluate((el) => el.style.backgroundPosition);
		const nearBefore = await near.evaluate((el) => el.style.backgroundPosition);

		const before = await page.locator('.world').evaluate((el) => el.style.transform);
		await field.hover();
		await page.mouse.down();
		await page.mouse.move(180, 160);
		const stretches = await page.locator('.cell').evaluateAll((els) =>
			els.map((el) => el.getAttribute('data-stretch')),
		);
		expect(new Set(stretches).size).toBeGreaterThan(1);
		await page.mouse.up();
		const after = await page.locator('.world').evaluate((el) => el.style.transform);
		expect(after).not.toBe(before);
		const farAfter = await far.evaluate((el) => el.style.backgroundPosition);
		const nearAfter = await near.evaluate((el) => el.style.backgroundPosition);
		expect(farAfter).not.toBe(farBefore);
		expect(nearAfter).not.toBe(nearBefore);
		expect(nearAfter).not.toBe(farAfter);
	});

	test('keeps the mouse grab point aligned with the camera', async ({ page }) => {
		await page.goto('/');
		const field = page.locator('.field.ready');
		await field.waitFor();
		await page.locator('.field .tile').first().waitFor();

		const start = await page.evaluate(() => {
			const parse = (transform: string) => {
				const match = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(transform);
				return { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) };
			};
			const tiles = [...document.querySelectorAll('.field .tile')];
			const tile = tiles.find((el) => {
				const r = el.getBoundingClientRect();
				return r.left > 40 && r.top > 40 && r.right < innerWidth - 80 && r.bottom < innerHeight - 80;
			});
			const r = (tile ?? document.querySelector('.field')!).getBoundingClientRect();
			const world = document.querySelector('.world') as HTMLElement;
			return {
				x: r.x + 24,
				y: r.y + 24,
				cam: parse(world.style.transform),
			};
		});

		await page.mouse.move(start.x, start.y);
		await page.mouse.down();
		await page.mouse.move(start.x + 80, start.y + 36);
		const cam = await page.locator('.world').evaluate((el) => {
			const match = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(
				(el as HTMLElement).style.transform,
			);
			return { x: Number(match?.[1] ?? 0), y: Number(match?.[2] ?? 0) };
		});
		expect(cam.x - start.cam.x).toBeCloseTo(80, 0);
		expect(cam.y - start.cam.y).toBeCloseTo(36, 0);
		await page.mouse.up();
	});

	test('keeps the skip link and keyboard path to the field', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		const field = page.locator('#field');
		await field.waitFor();
		const skip = page.locator('.skip-link');
		await expect(skip).toHaveAttribute('href', /#field$/);
		await expect(page.locator('#projects')).toHaveJSProperty('inert', true);

		await page.keyboard.press('Tab');
		await expect(skip).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/#field/);
		const focusedTile = page.locator('.field .tile:has(a:focus)');
		await expect(focusedTile).toBeVisible();
		const box = await focusedTile.boundingBox();
		expect(box).toBeTruthy();
		const viewport = page.viewportSize()!;
		expect(box!.x + box!.width / 2).toBeGreaterThan(0);
		expect(box!.x + box!.width / 2).toBeLessThan(viewport.width);
		expect(box!.y + box!.height / 2).toBeGreaterThan(0);
		expect(box!.y + box!.height / 2).toBeLessThan(viewport.height);
	});

	test('tabs through visible project tiles', async ({ page }) => {
		await page.goto('/');
		await page.locator('.field .tile').first().waitFor();
		await page.keyboard.press('Tab');
		await expect(page.locator('.skip-link')).toBeFocused();

		const cells: string[] = [];
		for (let i = 0; i < 24; i += 1) {
			await page.keyboard.press('Tab');
			const info = await page.evaluate(() => {
				const el = document.activeElement;
				if (!(el instanceof HTMLElement)) return { inField: false as const };
				const tile = el.closest('.field .tile');
				if (!tile) return { inField: false as const };
				const r = tile.getBoundingClientRect();
				return {
					inField: true as const,
					cell: tile.getAttribute('data-cell') ?? '',
					cx: r.x + r.width / 2,
					cy: r.y + r.height / 2,
					vw: window.innerWidth,
					vh: window.innerHeight,
				};
			});
			if (!info.inField) {
				expect(cells.length).toBeGreaterThan(1);
				break;
			}
			cells.push(info.cell);
			expect(info.cx).toBeGreaterThanOrEqual(0);
			expect(info.cx).toBeLessThanOrEqual(info.vw);
			expect(info.cy).toBeGreaterThanOrEqual(0);
			expect(info.cy).toBeLessThanOrEqual(info.vh);
		}
		expect(new Set(cells).size).toBeGreaterThan(1);
	});

	test('shows tile descriptions without hover on touch', async ({ page }, testInfo) => {
		await page.goto('/');
		await page.locator('.field .tile').first().waitFor();
		const desc = page.locator('.field .tile .desc').first();
		await expect(desc).toBeAttached();
		if (testInfo.project.name === 'mobile') {
			await expect(desc).toBeVisible();
		} else {
			const tile = page
				.locator('.field .tile')
				.filter({ has: page.locator('a[tabindex="0"]') })
				.first();
			await expect(tile.locator('.desc')).toBeHidden();
			await tile.hover();
			await expect(tile.locator('.desc')).toBeVisible();
		}
	});

	test('keeps #field and #projects targets after hydrate', async ({ page }) => {
		await page.goto('/#projects');
		await expect(page.locator('#projects')).toBeAttached();
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		await page.goto('/#field');
		await expect(page.locator('#field.ready')).toBeVisible();
	});
});

test.describe('homepage without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('paints the SSR project list as first paint', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.project-list a').first()).toBeVisible();
		await expect(page.locator('html')).not.toHaveAttribute('data-enhanced');
		await expect(page.locator('html')).not.toHaveAttribute('data-field', 'ready');
		await expect(page.locator('.skip-link')).toHaveAttribute('href', /#projects$/);
		await expect(page.locator('#projects')).not.toHaveAttribute('aria-hidden');
		await expect(page.locator('.field.ready')).toHaveCount(0);
		await expect(page.locator('.field .tile')).toHaveCount(0);
	});
});
