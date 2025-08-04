/**
 * Central configuration for all test automation
 */
export const testConfig = {
  // Testing modes
  HUMAN_MODE: process.env.HUMAN_MODE === 'true' || false,
  HEADLESS_MODE: process.env.HEADLESS_MODE !== 'false',
  RECORDING_MODE: process.env.RECORDING_MODE === 'true' || false,
  HUB_TOKEN: process.env.HUB_TOKEN || "",
  networkTimeout: 30000,
  // Timing settings for human-like interactions
  delays: {
    typing: { min: 50, max: 150 },
    thinking: { min: 10, max: 100 },
    navigation: { min: 10, max: 100 },
    // navigation: { min: 1000, max: 1100 },
    observation: { min: 10, max: 100 }
    // observation: { min: 1000, max: 1100 }
  },
  
  // Timeouts
  timeout: process.env.HUMAN_MODE === 'true' ? 1200000 : 70000,
  
  // Server settings
  BACKEND_SERVER: process.env.BACKEND_SERVER || "http://localhost:1235",
};
