import type { APIRoute } from 'astro';
import { sitemapIndexXml } from '../lib/seo';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
	const origin = site ?? new URL('https://joris.wtf/');
	return new Response(sitemapIndexXml(origin), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
