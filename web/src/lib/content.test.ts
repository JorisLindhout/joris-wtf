import { describe, expect, it } from 'vitest';
import { MissingContentError, projectsFromDocs, siteSeoFromDoc } from './content';

describe('projectsFromDocs', () => {
	it('throws when Sanity returned no projects', () => {
		expect(() => projectsFromDocs([])).toThrow(MissingContentError);
		expect(() => projectsFromDocs([])).toThrow(/no published projects/i);
	});

	it('throws when every project is missing required fields', () => {
		expect(() =>
			projectsFromDocs([{ title: 'Incomplete' }] as never),
		).toThrow(/required fields/i);
	});
});

describe('siteSeoFromDoc', () => {
	it('throws when siteSettings is missing', () => {
		expect(() => siteSeoFromDoc(null)).toThrow(MissingContentError);
		expect(() => siteSeoFromDoc(null)).toThrow(/required SEO fields/i);
	});

	it('throws when required SEO fields are missing', () => {
		expect(() => siteSeoFromDoc({ title: 'joris.wtf' } as never)).toThrow(
			/required SEO fields/i,
		);
	});
});
