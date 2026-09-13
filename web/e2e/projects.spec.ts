import { expect, test } from '@playwright/test';

test.describe('project pages', () => {
	test('lands on the primary tile with unique metadata', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		const href = await page.locator('#projects .project-list > li > a').first().getAttribute('href');
		expect(href).toMatch(/^\/[a-z0-9-]+$/);
		const slug = href!.slice(1);
		const title = (await page.locator(`#projects li#${slug} .title`).textContent())?.trim();
		expect(title).toBeTruthy();

		await page.goto(href!);
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			`https://joris.wtf/${slug}`,
		);
		await expect(page).toHaveTitle(new RegExp(title!));
		await expect(page.locator('h1.page-title')).toHaveText(title!);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			'content',
			/cdn\.sanity\.io/,
		);

		const jsonLd = JSON.parse(
			(await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
		) as { '@graph': Array<Record<string, unknown>> };
		expect(jsonLd['@graph'].some((node) => node['@type'] === 'WebPage')).toBe(true);

		const focused = page.locator(`.field .tile[data-slug="${slug}"]:has(a:focus)`);
		await expect(focused).toBeVisible();
		const box = await focused.boundingBox();
		expect(box).toBeTruthy();
		const viewport = page.viewportSize()!;
		expect(box!.x + box!.width / 2).toBeGreaterThan(viewport.width * 0.25);
		expect(box!.x + box!.width / 2).toBeLessThan(viewport.width * 0.75);
		expect(box!.y + box!.height / 2).toBeGreaterThan(viewport.height * 0.25);
		expect(box!.y + box!.height / 2).toBeLessThan(viewport.height * 0.75);
		await expect(focused.locator('a')).toBeFocused();
	});

	test('keeps / until the user tabs or arrows, then replaceState to a slug', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		await expect(page).toHaveURL(/\/(?:#.*)?$/);
		const homeTitle = await page.title();
		const before = await page.evaluate(() => history.length);

		await page.keyboard.press('Tab');
		await expect(page.locator('.skip-link')).toBeFocused();
		await expect(page).toHaveURL(/\/(?:#.*)?$/);

		await page.keyboard.press('Tab');
		await expect(page.locator('.field .tile a:focus')).toBeFocused();
		await expect(page).toHaveURL(/\/[a-z0-9-]+$/);
		expect(await page.evaluate(() => history.length)).toBe(before);
		expect(await page.title()).toBe(homeTitle);

		const slugPath = new URL(page.url()).pathname;
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		await expect(page).toHaveURL(new RegExp(`${slugPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
		const focused = page.locator(`.field .tile[data-slug="${slugPath.slice(1)}"]:has(a:focus)`);
		await expect(focused).toBeVisible();
		const box = await focused.boundingBox();
		expect(box).toBeTruthy();
		const viewport = page.viewportSize()!;
		expect(box!.x + box!.width / 2).toBeGreaterThan(viewport.width * 0.25);
		expect(box!.x + box!.width / 2).toBeLessThan(viewport.width * 0.75);
	});

	test('replaceState to a slug after a settled pan, without extra history', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-field', 'ready');
		await expect(page).toHaveURL(/\/(?:#.*)?$/);
		const homeTitle = await page.title();
		const before = await page.evaluate(() => history.length);
		const field = page.locator('.field.ready');
		const box = await field.boundingBox();
		expect(box).toBeTruthy();
		const x = box!.x + box!.width / 2;
		const y = box!.y + box!.height / 2;
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + 240, y, { steps: 12 });
		await page.mouse.up();
		await expect(page).toHaveURL(/\/[a-z0-9-]+$/, { timeout: 4000 });
		expect(await page.evaluate(() => history.length)).toBe(before);
		expect(await page.title()).toBe(homeTitle);
	});

	test('404 is not indexed', async ({ page }) => {
		const response = await page.goto('/not-a-project');
		expect(response?.status()).toBe(404);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	});

	test('llms.txt lists project URLs', async ({ page }) => {
		await page.goto('/');
		const firstHref = await page
			.locator('#projects .project-list > li > a')
			.first()
			.getAttribute('href');
		expect(firstHref).toMatch(/^\/[a-z0-9-]+$/);

		const llms = await (await page.request.get('/llms.txt')).text();
		expect(llms).toContain(`](https://joris.wtf${firstHref})`);
		expect(llms.startsWith('# ')).toBe(true);
	});

	test('sitemap lists project URLs', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('link[rel="sitemap"]')).toHaveAttribute(
			'href',
			'/sitemap-index.xml',
		);
		const firstHref = await page
			.locator('#projects .project-list > li > a')
			.first()
			.getAttribute('href');
		expect(firstHref).toMatch(/^\/[a-z0-9-]+$/);

		const index = await (await page.request.get('/sitemap-index.xml')).text();
		expect(index).toContain('https://joris.wtf/sitemap-0.xml');

		const sitemap = await (await page.request.get('/sitemap-0.xml')).text();
		expect(sitemap).toContain('https://joris.wtf/');
		expect(sitemap).toContain(`https://joris.wtf${firstHref}`);
		expect(sitemap).not.toContain('site.webmanifest');
		expect(sitemap).not.toContain('llms.txt');
	});
});

test.describe('project pages without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('exposes a destination link for the current project', async ({ page }) => {
		await page.goto('/');
		const href = await page.locator('#projects .project-list > li > a').first().getAttribute('href');
		expect(href).toMatch(/^\/[a-z0-9-]+$/);
		await page.goto(href!);
		const open = page.locator('.open-project');
		await expect(open).toBeVisible();
		await expect(open).toHaveAttribute('href', /^https?:/);
	});
});
