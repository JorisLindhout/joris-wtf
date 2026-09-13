import { describe, expect, it } from 'vitest';
import {
	SITE_THEME_COLOR,
	documentPath,
	jsonLdGraph,
	llmsTxt,
	serializeJsonLd,
	sitemapIndexXml,
	sitemapXml,
	webManifestFromSeo,
} from './seo';
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
		ogImage: 'https://cdn.sanity.io/images/elkf1eqd/production/autobahn-og.jpg',
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
		ogImage: 'https://cdn.sanity.io/images/elkf1eqd/production/linkedin-og.jpg',
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
				url: 'https://joris.wtf/autobahn',
				description: 'A fast, linear experiment in motion and type.',
				item: {
					'@type': 'CreativeWork',
					name: 'Autobahn',
					url: 'https://example.com/autobahn',
					image: 'https://cdn.sanity.io/images/elkf1eqd/production/autobahn-og.jpg',
					description: 'A fast, linear experiment in motion and type.',
				},
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: 'LinkedIn',
				url: 'https://joris.wtf/linkedin',
				item: {
					'@type': 'CreativeWork',
					name: 'LinkedIn',
					url: 'https://www.linkedin.com/',
					image: 'https://cdn.sanity.io/images/elkf1eqd/production/linkedin-og.jpg',
				},
			},
		]);
	});

	it('adds a WebPage for the focused project', () => {
		const data = jsonLdGraph(site, seo, projects, projects[0]);
		expect(data['@graph'][2]).toEqual({
			'@type': 'WebPage',
			'@id': 'https://joris.wtf/autobahn',
			url: 'https://joris.wtf/autobahn',
			name: 'Autobahn',
			description: 'A fast, linear experiment in motion and type.',
			isPartOf: { '@id': 'https://joris.wtf/#website' },
			about: {
				'@type': 'CreativeWork',
				name: 'Autobahn',
				url: 'https://example.com/autobahn',
				image: 'https://cdn.sanity.io/images/elkf1eqd/production/autobahn-og.jpg',
				description: 'A fast, linear experiment in motion and type.',
			},
		});
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

describe('documentPath', () => {
	it('keeps the origin slash and strips others', () => {
		expect(documentPath('/')).toBe('/');
		expect(documentPath('/mobey-run')).toBe('/mobey-run');
		expect(documentPath('/mobey-run/')).toBe('/mobey-run');
	});
});

describe('llmsTxt', () => {
	it('lists on-site project URLs', () => {
		const body = llmsTxt(site, seo, projects);
		expect(body).toContain('# joris.wtf');
		expect(body).toContain('> An infinite field of projects.');
		expect(body).toContain('[Autobahn](https://joris.wtf/autobahn)');
		expect(body).toContain('A fast, linear experiment in motion and type.');
		expect(body).toContain('[LinkedIn](https://joris.wtf/linkedin)');
	});
});

describe('sitemapXml', () => {
	it('lists the origin and project document URLs', () => {
		const body = sitemapXml(site, projects);
		expect(body).toContain('<loc>https://joris.wtf/</loc>');
		expect(body).toContain('<loc>https://joris.wtf/autobahn</loc>');
		expect(body).toContain('<loc>https://joris.wtf/linkedin</loc>');
		expect(body).not.toContain('site.webmanifest');
		expect(body).not.toContain('llms.txt');
	});

	it('omits reserved slugs', () => {
		const body = sitemapXml(site, [
			...projects,
			{ ...projects[0], slug: 'sitemap-0.xml', title: 'Sitemap collision' },
		]);
		expect(body).not.toContain('https://joris.wtf/sitemap-0.xml');
	});
});

describe('sitemapIndexXml', () => {
	it('points at the numbered sitemap', () => {
		expect(sitemapIndexXml(site)).toContain('<loc>https://joris.wtf/sitemap-0.xml</loc>');
	});
});
