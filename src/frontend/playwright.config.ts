import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { format } from 'date-fns';
import { testConfig } from './tests/playwright/utils/testConfig';

// Get current date in YYYY-MM-DD format for organizing test results
const currentDate = format(new Date(), 'yyyy-MM-dd');

// Determine headless mode based on the environment variable
const isHeadless = process.env.HEADLESS_MODE === 'true';

export default defineConfig({
  testDir: './tests/playwright/e2e',
  timeout: testConfig.timeout, // Use the dynamic timeout from testConfig
  // fullyParallel: true,
  // fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  // Configure output directories
  outputDir: path.join('tests', 'results', currentDate, 'test-artifacts'),

  reporter: [
    ['html', { outputFolder: path.join('tests', 'results', currentDate, 'reports') }],
    ['json', { outputFile: path.join('tests', 'results', currentDate, 'results.json') }],
  ],

  use: {
    baseURL: testConfig?.BACKEND_SERVER || 'http://localhost:1234',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Configure headless mode based on environment variable
    headless: isHeadless,

    // Optimize video recording to reduce flickering
    video: {
      mode: 'on', // Only keep videos when tests fail
      // Record only the last 5 seconds for successful tests
      // This significantly reduces flickering by only capturing the end result
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
    command: 'npm run dev',        // Command to start your application
    url: 'http://localhost:1234',  // URL to wait for before starting tests
    reuseExistingServer: !process.env.CI,  // Reuse running server in dev mode
    timeout: 120000,               // Time to wait for server to start (2 minutes)
  },
});
