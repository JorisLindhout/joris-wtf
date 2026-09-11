import { describe, expect, it } from 'vitest';
import { sortableTitle, sortProjects } from './sort';
import type { Project } from './types';
import {
	cellFullyInViewport,
	cellSeed,
	computeLayout,
	initialCamera,
	isPrimaryCell,
	nearSliver,
	farSliver,
	projectIndexForCell,
	TITLE_BLOCK,
	visibleCells,
} from './world';

function project(title: string): Project {
	return {
		title,
		slug: title.toLowerCase().replace(/\s+/g, '-'),
		url: 'https://example.com',
		openInNewTab: true,
		thumbnailAlt: title,
		src: 'https://cdn.sanity.io/images/elkf1eqd/production/x-640.webp',
		srcset: 'https://cdn.sanity.io/images/elkf1eqd/production/x-640.webp 640w',
	};
}

describe('sortableTitle', () => {
	it('strips a leading the, case-insensitive', () => {
		expect(sortableTitle('The Field')).toBe('field');
		expect(sortableTitle('THE Field')).toBe('field');
	});

	it('does not strip a or an in v1', () => {
		expect(sortableTitle('A Runner')).toBe('a runner');
		expect(sortableTitle('An Island')).toBe('an island');
	});
});

describe('sortProjects', () => {
	it('sorts by title while ignoring a leading the', () => {
		const sorted = sortProjects([
			project('The Zebra'),
			project('Autobahn'),
			project('the Apple'),
		]);
		expect(sorted.map((p) => p.title)).toEqual(['the Apple', 'Autobahn', 'The Zebra']);
	});
});

describe('world', () => {
	it('keeps tiles within min/max and fills a primary board for the full set', () => {
		const layout = computeLayout(390, 8);
		expect(layout.tileW).toBeGreaterThanOrEqual(160);
		expect(layout.tileW).toBeLessThanOrEqual(280);
		expect(layout.cols * layout.rows).toBeGreaterThanOrEqual(8);
	});

	it('honors a custom title block height', () => {
		const compact = computeLayout(390, 8);
		const tall = computeLayout(390, 8, TITLE_BLOCK + 14);
		expect(tall.tileH - compact.tileH).toBe(14);
		expect(tall.tileW).toBe(compact.tileW);
	});

	it('starts the camera with overscan into negative cells', () => {
		const layout = computeLayout(800, 8);
		const cam = initialCamera(layout, 800, 600);
		expect(cam.x).toBeLessThan(0);
		expect(cam.y).toBeLessThan(0);
	});

	it('clips a partial tile on both ends of each axis', () => {
		const viewports = [
			[390, 844],
			[768, 1024],
			[1280, 800],
			[1440, 900],
			[1920, 1080],
			[800, 600],
		] as const;

		for (const [vw, vh] of viewports) {
			const layout = computeLayout(vw, 8);
			const cam = initialCamera(layout, vw, vh);
			const xNear = nearSliver(cam.x, layout.cellW, layout.tileW);
			const xFar = farSliver(cam.x, vw, layout.cellW, layout.tileW);
			const yNear = nearSliver(cam.y, layout.cellH, layout.tileH);
			const yFar = farSliver(cam.y, vh, layout.cellH, layout.tileH);
			const minX = layout.tileW * 0.22;
			const maxX = layout.tileW * 0.72;
			const minY = layout.tileH * 0.22;
			const maxY = layout.tileH * 0.72;
			expect(xNear).toBeGreaterThanOrEqual(minX);
			expect(xNear).toBeLessThanOrEqual(maxX);
			expect(xFar).toBeGreaterThanOrEqual(minX);
			expect(xFar).toBeLessThanOrEqual(maxX);
			expect(yNear).toBeGreaterThanOrEqual(minY);
			expect(yNear).toBeLessThanOrEqual(maxY);
			expect(yFar).toBeGreaterThanOrEqual(minY);
			expect(yFar).toBeLessThanOrEqual(maxY);
		}
	});

	it('assigns ordered projects on the primary board and stable random outside', () => {
		expect(isPrimaryCell(0, 0, 3, 3, 8)).toBe(true);
		expect(projectIndexForCell(0, 0, 3, 3, 8)).toBe(0);
		expect(isPrimaryCell(-1, 0, 3, 3, 8)).toBe(false);
		const a = projectIndexForCell(-1, 0, 3, 3, 8);
		const b = projectIndexForCell(-1, 0, 3, 3, 8);
		expect(a).toBe(b);
		expect(a).toBeGreaterThanOrEqual(0);
		expect(a).toBeLessThan(8);
		expect(cellSeed(-2, 4)).toBe(cellSeed(-2, 4));
	});

	it('virtualizes to a bounded cell set', () => {
		const layout = computeLayout(400, 8);
		const cells = visibleCells(0, 0, 400, 400, layout, 1);
		expect(cells.length).toBeGreaterThan(0);
		expect(cells.length).toBeLessThan(80);
	});

	it('treats only fully on-screen tiles as keyboard tab stops', () => {
		const layout = computeLayout(800, 8);
		const cam = initialCamera(layout, 800, 600);
		expect(cellFullyInViewport(0, 0, cam.x, cam.y, 800, 600, layout)).toBe(true);
		expect(cellFullyInViewport(-1, 0, cam.x, cam.y, 800, 600, layout)).toBe(false);
		expect(cellFullyInViewport(0, -1, cam.x, cam.y, 800, 600, layout)).toBe(false);
		expect(cellFullyInViewport(10, 10, cam.x, cam.y, 800, 600, layout)).toBe(false);
	});
});
