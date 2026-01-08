/* eslint-disable no-undef */
export const TEST_CONFIG = {
  BASE_URL: process.env.TEST_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  HEADLESS: process.env.HEADLESS !== 'false', // Set to false to watch tests run
  SLOW_MO: parseInt(process.env.SLOW_MO || '0'), // Slow down by ms for debugging
  
  // Test user credentials - load from environment variables for security
  FOREVER_TEST_USER: {
    email: process.env.FOREVER_TEST_EMAIL || 'test@example.com',
    password: process.env.FOREVER_TEST_PASSWORD || 'TestPassword123!',
    firstName: 'Forever',
    lastName: 'Test',
    phone: '5551235670'
  },
  
  // Timeouts
  TIMEOUT: {
    DEFAULT: 5000,
    NAVIGATION: 10000,
    API: 15000
  }
};

// Utility to wait for navigation
export async function waitForNavigation(page, expectedPath, timeout = 5000) {
  await page.waitForFunction(
    (path) => window.location.pathname === path,
    { timeout },
    expectedPath
  );
}

// Utility to take screenshot on failure
export async function captureScreenshot(page, testName) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `screenshots/${testName.replace(/\s/g, '-')}-${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
  } catch (error) {
    console.error('Failed to capture screenshot:', error.message);
  }
}

// Utility to find and click button by text
export async function clickButtonByText(page, text) {
  await page.evaluate((btnText) => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.toLowerCase().includes(btnText.toLowerCase()));
    if (button) {
      button.click();
      return true;
    }
    throw new Error(`Button with text "${btnText}" not found`);
  }, text);
}

// Utility to wait and clear then type
export async function typeInField(page, selector, text) {
  await page.waitForSelector(selector);
  await page.click(selector, { clickCount: 3 }); // Select all
  await page.keyboard.press('Backspace');
  await page.type(selector, text);
}

// Utility to wait/delay
export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
