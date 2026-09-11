import type { Project } from './types';

/** Strip a leading English article used in titles. v1: only "the ". */
export function sortableTitle(title: string): string {
	return title.replace(/^the\s+/i, '').toLocaleLowerCase();
}

export function sortProjects(projects: readonly Project[]): Project[] {
	return [...projects].sort((a, b) =>
		sortableTitle(a.title).localeCompare(sortableTitle(b.title), 'en', {
			sensitivity: 'base',
			numeric: true,
		}),
	);
}
