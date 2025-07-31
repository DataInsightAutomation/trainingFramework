import { Page, Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import { testConfig } from './testConfig';
import { logger } from './logger';

// Current date for organizing test results
export const currentDate = format(new Date(), 'yyyy-MM-dd');

// Test configuration - set HUMAN_MODE to true for slower, more natural interactions
export const config = {
  HUMAN_MODE: testConfig.HUMAN_MODE,
  HEADLESS_MODE: testConfig.HEADLESS_MODE,
  RECORDING_MODE: testConfig.RECORDING_MODE,
  delays: testConfig.delays,
  timeout: testConfig.timeout,
  BACKEND_SERVER: testConfig.BACKEND_SERVER,
  networkTimeout: 50000,
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

  // More realistic human-like behavior
  try {
    const page = locator.page();
    
    // First hover over the element to simulate mouse movement
    await locator.hover({ timeout: 2000 }).catch(() => {
      // If hover fails, continue anyway - some elements might be problematic
      logger.debug('Hover action failed, continuing with click');
    });
    
    // Add a small random delay after hovering (as humans pause slightly)
    const hoverDelay = Math.floor(Math.random() * 300) + 100; // 100-400ms
    await page.waitForTimeout(hoverDelay);
    
    // Calculate a slightly randomized position within the element for more natural clicking
    const box = await locator.boundingBox().catch(() => null);
    
    if (box) {
      // Get dimensions and calculate a point slightly off-center
      const offsetX = box.width * (0.4 + Math.random() * 0.2); // 40-60% across
      const offsetY = box.height * (0.4 + Math.random() * 0.2); // 40-60% down
      
      logger.debug(`Human-like click at offset position within element`);
      await locator.click({
        position: { x: offsetX, y: offsetY },
        force: false, // Try without force first for more realistic behavior
        timeout: 3000
      }).catch(async (e) => {
        // If regular click fails, fall back to force click
        logger.debug(`Natural click failed (${e.message}), using force click`);
        await locator.click({ force: true });
      });
    } else {
      // Fallback if we can't get the bounding box
      logger.debug('Using standard click (no bounding box)');
      await locator.click({ force: true });
    }
    
    // Add a small delay after clicking as humans need time to process what happened
    const postClickDelay = Math.floor(Math.random() * 200) + 50; // 50-250ms
    await page.waitForTimeout(postClickDelay);
    
  } catch (error) {
    // Fallback to simple click if anything goes wrong
    logger.warn(`Error during human click: ${error.message}, falling back to basic click`);
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
    logger.debug(`Human pause (${type}): ${delay}ms`);
    await page.waitForTimeout(delay);
  }
}

/**
 * Log test mode configuration
 */
export function logTestConfiguration() {
  logger.info(`🔧 Mode configuration:`);
  logger.info(`   ${config.HUMAN_MODE ? '🧑 HUMAN MODE' : '🤖 FAST MODE'} - ${config.HUMAN_MODE ? 'slower, natural' : 'efficient'} interactions`);
  logger.info(`   ${config.HEADLESS_MODE ? '🖥️ HEADLESS' : '🎬 BROWSER VISIBLE'} - ${config.HEADLESS_MODE ? 'no browser UI' : 'browser UI visible'}`);
  logger.info(`   ${config.RECORDING_MODE ? '📹 RECORDING' : '📊 TESTING'} - ${config.RECORDING_MODE ? 'optimized for videos' : 'standard test run'}`);
  logger.info(`   ⏱️ Timeout: ${config.timeout/1000}s`);
}

/**
 * Capture the final state of a test with both screenshot and video
 * This provides a clean way to document the test result without flickering
 */
export async function captureTestResult(page: Page, testName: string): Promise<void> {
  try {
    // Take a screenshot of the final state
    await page.screenshot({ 
      path: getScreenshotPath(`${testName}-final-state.png`),
      fullPage: true 
    });
    
    // Add a small delay to ensure everything is settled
    await page.waitForTimeout(500);
    
    // Video is controlled by Playwright config and will be retained if needed
    logger.info(`Test "${testName}" completed - results captured`);
  } catch (error) {
    logger.error(`Failed to capture test result: ${error.message}`);
  }
}
