import { describe, expect, it } from 'vitest';
import { sortableTitle, sortProjects } from './sort';
import type { Project } from './types';
import {
	cellSeed,
	computeLayout,
	initialCamera,
	isPrimaryCell,
	projectIndexForCell,
	visibleCells,
} from './world';

function project(title: string): Project {
	return {
		title,
		slug: title.toLowerCase().replace(/\s+/g, '-'),
		url: 'https://example.com',
		openInNewTab: true,
		thumbnailAlt: title,
		imageId: 'x',
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

	it('starts the camera with overscan into negative cells', () => {
		const layout = computeLayout(800, 8);
		const cam = initialCamera(layout);
		expect(cam.x).toBeLessThan(0);
		expect(cam.y).toBeLessThan(0);
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
});
