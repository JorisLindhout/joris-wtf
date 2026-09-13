import type { APIRoute } from 'astro';
import { getProjects, getSiteSeo } from '../lib/content';
import { llmsTxt } from '../lib/seo';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const [seo, projects] = await Promise.all([getSiteSeo(), getProjects()]);
	const origin = site ?? new URL('https://joris.wtf/');
	return new Response(llmsTxt(origin, seo, projects), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
