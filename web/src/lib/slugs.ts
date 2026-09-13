/** Paths and filenames a project slug must not shadow. */
export const RESERVED_PROJECT_SLUGS = [
	'404',
	'_astro',
	'favicon',
	'favicon.ico',
	'llms.txt',
	'robots.txt',
	'site.webmanifest',
	'sitemap-0',
	'sitemap-0.xml',
	'sitemap-index',
	'sitemap-index.xml',
] as const;

const reserved = new Set<string>(RESERVED_PROJECT_SLUGS);

export function isReservedProjectSlug(slug: string): boolean {
	return reserved.has(slug);
}

export function projectPath(slug: string): string {
	return `/${slug}`;
}
