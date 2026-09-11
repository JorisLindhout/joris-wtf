import type { APIRoute } from 'astro';
import { getSiteSeo } from '../lib/content';
import { webManifestFromSeo } from '../lib/seo';

export const GET: APIRoute = async () => {
	const seo = await getSiteSeo();
	return new Response(JSON.stringify(webManifestFromSeo(seo), null, '\t'), {
		headers: {
			'Content-Type': 'application/manifest+json; charset=utf-8',
		},
	});
};
