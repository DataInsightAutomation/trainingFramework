import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { format } from 'date-fns';

// Get current date in YYYY-MM-DD format for organizing test results
const currentDate = format(new Date(), 'yyyy-MM-dd');

// Check for headless mode from environment variable
const isHeadless = process.env.HEADLESS_MODE !== 'false';

export default defineConfig({
  testDir: './tests/playwright/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Configure output directories
  outputDir: path.join('tests', 'results', currentDate, 'test-artifacts'),

  reporter: [
    ['html', { outputFolder: path.join('tests', 'results', currentDate, 'reports') }],
    ['json', { outputFile: path.join('tests', 'results', currentDate, 'results.json') }],
  ],

  use: {
    baseURL: 'http://localhost:1234',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Configure headless mode based on environment variable
    headless: isHeadless,

    video: {
      mode: 'on', // Record videos for all test runs
      size: { width: 1280, height: 720 },
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1234',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
