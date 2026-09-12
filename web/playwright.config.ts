import { defineConfig, devices } from '@playwright/test';

const port = 4321;
const baseURL = `http://127.0.0.1:${port}`;
const isCI = !!process.env.CI;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	reporter: 'list',
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	webServer: {
		command: isCI
			? `npx astro preview --host 127.0.0.1 --port ${port}`
			: `npx astro dev --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: !isCI,
		timeout: 120_000,
		stdout: 'pipe',
		stderr: 'pipe',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{
			name: 'mobile',
			use: { ...devices['iPhone 13'], browserName: 'chromium' },
		},
	],
});
