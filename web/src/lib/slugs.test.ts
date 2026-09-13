import { describe, expect, it } from 'vitest';
import { isReservedProjectSlug, projectPath } from './slugs';

describe('projectPath', () => {
	it('prefixes a slug', () => {
		expect(projectPath('mobey-run')).toBe('/mobey-run');
	});
});

describe('isReservedProjectSlug', () => {
	it('blocks filenames the site already serves', () => {
		expect(isReservedProjectSlug('llms.txt')).toBe(true);
		expect(isReservedProjectSlug('robots.txt')).toBe(true);
		expect(isReservedProjectSlug('sitemap-0.xml')).toBe(true);
		expect(isReservedProjectSlug('sitemap-index.xml')).toBe(true);
		expect(isReservedProjectSlug('mobey-run')).toBe(false);
	});
});
