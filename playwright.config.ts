import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  reporter: 'list',
  timeout: 7 * 1000,
  workers: '50%',
  testDir: './tests',
  outputDir: './tmp/artifacts',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    locale: 'ru-RU',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    cwd: process.env.GITHUB_WORKSPACE,
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true
  }
});