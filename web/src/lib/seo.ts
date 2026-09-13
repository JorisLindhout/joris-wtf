import { isReservedProjectSlug, projectPath } from './slugs';
import type { Project, SiteSeo } from './types';

/** Matches `--bg` in global.css — theme-color meta and web app manifest. */
export const SITE_THEME_COLOR = '#070708';

export type WebAppManifestIcon = {
	src: string;
	sizes: string;
	type: string;
	purpose: 'any' | 'maskable';
};

export type WebAppManifest = {
	name: string;
	short_name: string;
	description: string;
	lang: string;
	start_url: string;
	id: string;
	display: 'standalone';
	background_color: string;
	theme_color: string;
	icons: WebAppManifestIcon[];
};

export function absoluteUrl(path: string, site: URL): URL {
	return new URL(path, site);
}

/** Origin `/` keeps its slash; every other document path does not. */
export function documentPath(pathname: string): string {
	if (pathname === '/' || pathname === '') return '/';
	return pathname.replace(/\/+$/, '') || '/';
}

export function webManifestFromSeo(seo: SiteSeo): WebAppManifest {
	return {
		name: seo.siteName,
		short_name: seo.siteName,
		description: seo.description,
		lang: seo.locale,
		start_url: '/',
		id: '/',
		display: 'standalone',
		background_color: SITE_THEME_COLOR,
		theme_color: SITE_THEME_COLOR,
		icons: [
			{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
			{ src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
			{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
			{
				src: '/web-app-manifest-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	};
}

export function projectDocumentTitle(project: Project, seo: SiteSeo): string {
	return `${project.title} — ${seo.siteName}`;
}

function creativeWork(project: Project): Record<string, unknown> {
	const work: Record<string, unknown> = {
		'@type': 'CreativeWork',
		name: project.title,
		url: project.url,
		image: project.ogImage,
	};
	if (project.description) work.description = project.description;
	return work;
}

export function jsonLdGraph(
	site: URL,
	seo: SiteSeo,
	projects?: readonly Project[],
	project?: Project,
) {
	const origin = new URL('/', site).href;
	const graph: Record<string, unknown>[] = [
		{
			'@type': 'WebSite',
			'@id': new URL('/#website', site).href,
			url: origin,
			name: seo.siteName,
			description: seo.description,
			inLanguage: seo.locale,
			author: {
				'@type': 'Person',
				name: seo.title,
				url: origin,
			},
		},
	];

	if (projects?.length) {
		graph.push({
			'@type': 'ItemList',
			'@id': new URL('/#project-list', site).href,
			name: 'Projects',
			numberOfItems: projects.length,
			itemListElement: projects.map((entry, index) => {
				const item: Record<string, unknown> = {
					'@type': 'ListItem',
					position: index + 1,
					name: entry.title,
					url: new URL(projectPath(entry.slug), site).href,
					item: creativeWork(entry),
				};
				if (entry.description) item.description = entry.description;
				return item;
			}),
		});
	}

	if (project) {
		const pageUrl = new URL(projectPath(project.slug), site).href;
		graph.push({
			'@type': 'WebPage',
			'@id': pageUrl,
			url: pageUrl,
			name: project.title,
			description: project.description ?? seo.description,
			isPartOf: { '@id': new URL('/#website', site).href },
			about: creativeWork(project),
		});
	}

	return {
		'@context': 'https://schema.org',
		'@graph': graph,
	};
}

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function sitemapIndexXml(site: URL): string {
	const loc = xmlEscape(new URL('/sitemap-0.xml', site).href);
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		'<sitemap>',
		`<loc>${loc}</loc>`,
		'</sitemap>',
		'</sitemapindex>',
		'',
	].join('\n');
}

export function sitemapXml(site: URL, projects: readonly Project[]): string {
	const locs = [
		new URL('/', site).href,
		...projects
			.filter((project) => !isReservedProjectSlug(project.slug))
			.map((project) => new URL(projectPath(project.slug), site).href),
	];
	const urls = locs.map((loc) => `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n  </url>`).join('\n');
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		'</urlset>',
		'',
	].join('\n');
}

export function llmsTxt(site: URL, seo: SiteSeo, projects: readonly Project[]): string {
	const lines = [
		`# ${seo.siteName}`,
		'',
		`> ${seo.description}`,
		'',
		'The site is a pannable field of project tiles. Each project has a page on this origin that opens the field with that tile centered.',
		'',
		'## Projects',
		'',
	];
	for (const entry of projects) {
		const href = new URL(projectPath(entry.slug), site).href;
		const desc = entry.description ? `: ${entry.description}` : '';
		lines.push(`- [${entry.title}](${href})${desc}`);
	}
	lines.push('');
	return lines.join('\n');
}

export function serializeJsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
