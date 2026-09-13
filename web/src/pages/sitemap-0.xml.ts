import type { APIRoute } from 'astro';
import { getProjects } from '../lib/content';
import { sitemapXml } from '../lib/seo';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const projects = await getProjects();
	const origin = site ?? new URL('https://joris.wtf/');
	return new Response(sitemapXml(origin, projects), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
