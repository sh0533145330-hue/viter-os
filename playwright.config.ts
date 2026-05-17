import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './apps',
  testMatch: '**/e2e/**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'operator-chrome',
      testDir: './apps/operator-app/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tom-chrome',
      testDir: './apps/tom-app/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tim-chrome',
      testDir: './apps/tim-app/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
