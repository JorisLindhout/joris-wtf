import { defineCliConfig } from 'sanity/cli';
import { dataset, projectId } from './env';

export default defineCliConfig({
	api: { projectId, dataset },
	typegen: {
		enabled: true,
		path: '../web/src/**/*.{ts,tsx,js,jsx,astro,svelte}',
		schema: 'schema.json',
		generates: '../web/sanity.types.ts',
		overloadClientMethods: true,
	},
});
