// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import sanity from '@sanity/astro';
import { loadEnv } from 'vite';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
	process.env.NODE_ENV ?? 'development',
	process.cwd(),
	'',
);

export default defineConfig({
	site: 'https://joris.wtf',
	devToolbar: { enabled: false },
	integrations: [
		svelte(),
		sitemap(),
		sanity({
			projectId: PUBLIC_SANITY_PROJECT_ID || 'elkf1eqd',
			dataset: PUBLIC_SANITY_DATASET || 'production',
			apiVersion: '2026-09-11',
			useCdn: false,
		}),
	],
});
