import { defineConfig, devices } from '@playwright/test';

const port = 4321;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'list',
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4321',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{
			name: 'mobile',
			use: { ...devices['iPhone 13'], browserName: 'chromium' },
		},
	],
});
