import { describe, expect, it } from 'vitest';
import { SITE_THEME_COLOR, jsonLdGraph, serializeJsonLd, webManifestFromSeo } from './seo';
import type { Project, SiteSeo } from './types';

const site = new URL('https://joris.wtf/');
const seo: SiteSeo = {
	title: 'joris.wtf',
	description: 'An infinite field of projects.',
	siteName: 'joris.wtf',
	ogTitle: 'joris.wtf',
	ogDescription: 'An infinite field of projects.',
	ogImage: 'https://cdn.sanity.io/images/elkf1eqd/production/og.jpg',
	ogImageAlt: 'joris.wtf — an infinite field of projects',
	ogImageWidth: 1200,
	ogImageHeight: 630,
	twitterCard: 'summary_large_image',
	locale: 'en',
};

const projects: Project[] = [
	{
		title: 'Autobahn',
		slug: 'autobahn',
		url: 'https://example.com/autobahn',
		openInNewTab: true,
		thumbnailAlt: 'Autobahn',
		fieldPresence: 'normal',
		description: 'A fast, linear experiment in motion and type.',
		src: 'https://cdn.sanity.io/images/elkf1eqd/production/autobahn-640.webp',
		srcset: 'https://cdn.sanity.io/images/elkf1eqd/production/autobahn-640.webp 640w',
	},
	{
		title: 'LinkedIn',
		slug: 'linkedin',
		url: 'https://www.linkedin.com/',
		openInNewTab: true,
		thumbnailAlt: 'LinkedIn',
		fieldPresence: 'normal',
		src: 'https://cdn.sanity.io/images/elkf1eqd/production/linkedin-640.webp',
		srcset: 'https://cdn.sanity.io/images/elkf1eqd/production/linkedin-640.webp 640w',
	},
];

describe('jsonLdGraph', () => {
	it('emits WebSite JSON-LD for the apex', () => {
		const data = jsonLdGraph(site, seo);
		expect(data['@context']).toBe('https://schema.org');
		expect(data['@graph']).toEqual([
			{
				'@type': 'WebSite',
				'@id': 'https://joris.wtf/#website',
				url: 'https://joris.wtf/',
				name: 'joris.wtf',
				description: 'An infinite field of projects.',
				inLanguage: 'en',
				author: {
					'@type': 'Person',
					name: 'joris.wtf',
					url: 'https://joris.wtf/',
				},
			},
		]);
	});

	it('adds a homepage ItemList from projects', () => {
		const data = jsonLdGraph(site, seo, projects);
		const list = data['@graph'][1] as Record<string, unknown>;
		expect(list['@type']).toBe('ItemList');
		expect(list.numberOfItems).toBe(2);
		expect(list.itemListElement).toEqual([
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Autobahn',
				url: 'https://example.com/autobahn',
				description: 'A fast, linear experiment in motion and type.',
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: 'LinkedIn',
				url: 'https://www.linkedin.com/',
			},
		]);
	});

	it('escapes HTML in serialized JSON-LD', () => {
		const raw = serializeJsonLd({ name: '</script><p>x</p>' });
		expect(raw).toContain('\\u003c/script>');
		expect(raw).not.toContain('</script>');
	});
});

describe('webManifestFromSeo', () => {
	it('fills name, description, and lang from site SEO', () => {
		const manifest = webManifestFromSeo(seo);
		expect(manifest).toMatchObject({
			name: 'joris.wtf',
			short_name: 'joris.wtf',
			description: 'An infinite field of projects.',
			lang: 'en',
			start_url: '/',
			id: '/',
			display: 'standalone',
			theme_color: SITE_THEME_COLOR,
			background_color: SITE_THEME_COLOR,
		});
		expect(manifest.icons).toEqual([
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
		]);
	});
});
