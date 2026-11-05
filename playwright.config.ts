import { defineConfig, devices } from '@playwright/test';

// Версию стартера задаёт его workflow (STARTER_VERSION). Нет переменной — старый стартер, версия 1
const STARTER_VERSION = Number(process.env.STARTER_VERSION) || 1;

export default defineConfig({
  reporter: 'list',
  timeout: 7 * 1000,
  workers: '50%',
  testDir: STARTER_VERSION >= 2 ? './tests-v2' : './tests',
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