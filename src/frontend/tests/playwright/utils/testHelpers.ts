import { Page, Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';  // Add missing fs import
import { format } from 'date-fns';  // Add missing format import
import { testConfig } from './testConfig';

// Current date for organizing test results
export const currentDate = format(new Date(), 'yyyy-MM-dd');

// Test configuration - set HUMAN_MODE to true for slower, more natural interactions
export const config = {
  HUMAN_MODE: process.env.HUMAN_MODE === 'true' || false,
  HEADLESS_MODE: process.env.HEADLESS_MODE !== 'false',
  RECORDING_MODE: process.env.RECORDING_MODE === 'true' || false,
  delays: {
    typing: { min: 50, max: 150 },
    thinking: { min: 500, max: 600 },
    navigation: { min: 1000, max: 1100 },
    observation: { min: 1000, max: 1100 }
  },
  timeout: process.env.HUMAN_MODE === 'true' ? 1200000 : 30000,
  BACKEND_SERVER: process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:1234",
};

/**
 * Get the path for storing media files (screenshots, videos)
 */
export function getMediaPath(type: 'screenshots' | 'videos', filename: string, testName: string = 'train-form-test'): string {
  const resultsDir = path.join(
    process.cwd(), 
    'tests', 
    'results', 
    currentDate, 
    testName,
    type
  );
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  return path.join(resultsDir, filename);
}

/**
 * Get the path for storing screenshots
 */
export function getScreenshotPath(filename: string, testName: string = 'defaultTestName'): string {
  return getMediaPath('screenshots', filename, testName);
}

/**
 * Type text with human-like delays between keystrokes
 */
export async function humanType(page: Page, text: string): Promise<void> {
  if (!config.HUMAN_MODE) {
    await page.keyboard.type(text);
    return;
  }

  for (const char of text) {
    await page.keyboard.type(char);
    const delay = Math.floor(Math.random() * 
      (config.delays.typing.max - config.delays.typing.min) + 
      config.delays.typing.min);
    await page.waitForTimeout(delay);
  }
}

/**
 * Click with human-like behavior
 */
export async function humanClick(locator: any): Promise<void> {
  if (!config.HUMAN_MODE) {
    await locator.click({ force: true });
    return;
  }

  const thinkingDelay = Math.floor(Math.random() * 
    (config.delays.thinking.max - config.delays.thinking.min) + 
    config.delays.thinking.min);
  await locator.page().waitForTimeout(thinkingDelay);
  
  const isDropdownItem = await locator.evaluate(el => {
    return el.classList.contains('dropdown-item') || 
           el.getAttribute('role') === 'option' ||
           el.closest('[role="listbox"]') !== null;
  }).catch(() => false);
  
  if (isDropdownItem) {
    console.log('Clicking dropdown item (center position for reliability)');
    await locator.click({ force: true });
  } else {
    console.log('Using force click to avoid interception issues');
    await locator.click({ force: true });
  }
}

/**
 * Pause with human-like delay
 */
export async function humanPause(page: Page, type: 'thinking' | 'navigation' | 'observation'): Promise<void> {
  if (testConfig.HUMAN_MODE) {
    const { min, max } = testConfig.delays[type];
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await page.waitForTimeout(delay);
  }
}

/**
 * Log test mode configuration
 */
export function logTestConfiguration() {
  console.log(`🔧 Mode configuration:`);
  console.log(`   ${config.HUMAN_MODE ? '🧑 HUMAN MODE' : '🤖 FAST MODE'} - ${config.HUMAN_MODE ? 'slower, natural' : 'efficient'} interactions`);
  console.log(`   ${config.HEADLESS_MODE ? '🖥️ HEADLESS' : '🎬 BROWSER VISIBLE'} - ${config.HEADLESS_MODE ? 'no browser UI' : 'browser UI visible'}`);
  console.log(`   ${config.RECORDING_MODE ? '📹 RECORDING' : '📊 TESTING'} - ${config.RECORDING_MODE ? 'optimized for videos' : 'standard test run'}`);
  console.log(`   ⏱️ Timeout: ${config.timeout/1000}s`);
}
