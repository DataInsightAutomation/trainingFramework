import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { format } from 'date-fns';
import { testConfig } from './tests/playwright/utils/testConfig';

// Get current date in YYYY-MM-DD format for organizing test results
const currentDate = format(new Date(), 'yyyy-MM-dd');

export default defineConfig({
  testDir: './tests/playwright/e2e',
  timeout: testConfig.timeout, // Use the dynamic timeout from testConfig
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
    baseURL: testConfig.BACKEND_SERVER, // Use the server URL from testConfig
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Configure headless mode based on testConfig
    headless: testConfig.HEADLESS_MODE,

    // Enable video recording based on testConfig
    video: testConfig.RECORDING_MODE ? {
      mode: 'on',
      size: { width: 1280, height: 720 },
    } : {
      mode: 'on-first-retry',
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
