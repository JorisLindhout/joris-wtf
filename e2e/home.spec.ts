import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const titles = [
	'Autobahn',
	'DR-101',
	'Ell Creative',
	'Juno',
	'Kijkdoos',
	'LinkedIn',
	'Mobey Run',
	'Phantasm',
];

test.describe('homepage', () => {
	test('exposes SEO metadata and a full HTML project list', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/joris\.wtf/);
		await expect(page.locator('meta[name="description"]')).toHaveAttribute(
			'content',
			/infinite field/i,
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://joris.wtf/',
		);

		const list = page.locator('#projects');
		await expect(list).toBeAttached();
		for (const title of titles) {
			await expect(list.locator('a').filter({ hasText: title })).toHaveCount(1);
		}

		const blankLinks = list.locator('a[target="_blank"]');
		const count = await blankLinks.count();
		expect(count).toBeGreaterThan(0);
		for (let i = 0; i < count; i += 1) {
			await expect(blankLinks.nth(i)).toHaveAttribute('rel', /noopener/);
		}

		const images = list.locator('img');
		const imageCount = await images.count();
		expect(imageCount).toBe(titles.length);
		for (let i = 0; i < imageCount; i += 1) {
			await expect(images.nth(i)).toHaveAttribute('src', /\.webp$/);
			await expect(images.nth(i)).toHaveAttribute('alt', /.+/);
		}
	});

	test('has no serious axe violations on first paint', async ({ page }) => {
		await page.goto('/');
		await page.locator('.field').waitFor();
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
		const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
	});

	test('hydrates a pannable field with overscan tiles', async ({ page }) => {
		await page.goto('/');
		const field = page.locator('.field');
		await expect(field).toBeVisible();
		await expect(page.locator('.field .tile').first()).toBeVisible();
		const tileCount = await page.locator('.field .tile').count();
		expect(tileCount).toBeGreaterThan(titles.length / 2);

		const before = await page.locator('.world').evaluate((el) => el.style.transform);
		await field.hover();
		await page.mouse.down();
		await page.mouse.move(180, 160);
		await page.mouse.up();
		const after = await page.locator('.world').evaluate((el) => el.style.transform);
		expect(after).not.toBe(before);
	});

	test('keeps the skip link and keyboard path to the list', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');
		const skip = page.locator('.skip-link');
		await expect(skip).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/#projects/);
	});
});
