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

export function jsonLdGraph(site: URL, seo: SiteSeo, projects?: readonly Project[]) {
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
			itemListElement: projects.map((project, index) => {
				const item: Record<string, unknown> = {
					'@type': 'ListItem',
					position: index + 1,
					name: project.title,
					url: project.url,
				};
				if (project.description) item.description = project.description;
				return item;
			}),
		});
	}

	return {
		'@context': 'https://schema.org',
		'@graph': graph,
	};
}

export function serializeJsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
