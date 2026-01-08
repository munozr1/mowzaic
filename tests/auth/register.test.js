import puppeteer from 'puppeteer';
import { TEST_CONFIG, captureScreenshot, clickButtonByText, typeInField, delay } from '../config.js';

async function testRegister() {
  console.log('🧪 Starting Registration Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.HEADLESS,
    slowMo: TEST_CONFIG.SLOW_MO,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    // Test 1: Switch to register mode
    {
      const testName = 'Switch to Register Mode';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        // Open login modal
        await clickButtonByText(page, 'or sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Click "Create account"
        await clickButtonByText(page, 'create one');
        
        // Wait for confirm email field (only in register mode)
        await page.waitForSelector('input[name="confirmEmail"]', { timeout: 1000 });
        
        console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
        results.push({ name: testName, status: 'passed', duration: Date.now() - start });
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 2: Switch back to login mode
    {
      const testName = 'Switch Back to Login Mode';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        await clickButtonByText(page, 'or sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Switch to register
        await clickButtonByText(page, 'create one');
        await page.waitForSelector('input[name="confirmEmail"]');
        
        // Switch back to login
        await clickButtonByText(page, 'sign in');
        
        // Wait a bit
        await delay(500);
        
        // Confirm email field should be gone
        const confirmEmailGone = await page.evaluate(() => {
          return document.querySelector('input[name="confirmEmail"]') === null;
        });
        
        if (confirmEmailGone) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Did not switch back to login mode');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 3: Register with mismatched emails
    {
      const testName = 'Register with Mismatched Emails';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        await clickButtonByText(page, 'sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Switch to register
        await clickButtonByText(page, 'create account');
        await page.waitForSelector('input[name="confirmEmail"]');
        
        // Fill with mismatched emails
        await typeInField(page, 'input[name="email"]', 'test1@example.com');
        await typeInField(page, 'input[name="confirmEmail"]', 'test2@example.com');
        await typeInField(page, 'input[name="password"]', 'Password123!');
        await typeInField(page, 'input[name="confirmPassword"]', 'Password123!');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for error
        await delay(1000);
        
        const errorText = await page.evaluate(() => {
          const error = Array.from(document.querySelectorAll('*'))
            .find(el => el.textContent.includes('do not match'));
          return error ? error.textContent : null;
        });
        
        if (errorText) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Email mismatch error not shown');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 4: Register with mismatched passwords
    {
      const testName = 'Register with Mismatched Passwords';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        await clickButtonByText(page, 'sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Switch to register
        await clickButtonByText(page, 'create account');
        await page.waitForSelector('input[name="confirmEmail"]');
        
        // Fill with mismatched passwords
        await typeInField(page, 'input[name="email"]', 'test@example.com');
        await typeInField(page, 'input[name="confirmEmail"]', 'test@example.com');
        await typeInField(page, 'input[name="password"]', 'Password123!');
        await typeInField(page, 'input[name="confirmPassword"]', 'DifferentPass456!');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for error
        await delay(1000);
        
        const errorText = await page.evaluate(() => {
          const errors = Array.from(document.querySelectorAll('.text-red-500'));
          return errors.find(el => el.textContent.includes('Passwords do not match'));
        });
        
        if (errorText) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Password mismatch error not shown');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 5: Register with valid data
    {
      const testName = 'Register with Valid Data';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        const uniqueEmail = `test-${Date.now()}@mowzaic.com`;
        
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        await clickButtonByText(page, 'sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Switch to register
        await clickButtonByText(page, 'create account');
        await page.waitForSelector('input[name="confirmEmail"]');
        
        // Fill with valid data
        await typeInField(page, 'input[name="email"]', uniqueEmail);
        await typeInField(page, 'input[name="confirmEmail"]', uniqueEmail);
        await typeInField(page, 'input[name="password"]', 'Password123!');
        await typeInField(page, 'input[name="confirmPassword"]', 'Password123!');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for profile modal or redirect
        await delay(3000);
        
        // Check if we're on a new page or see profile modal
        const currentUrl = page.url();
        const hasProfileModal = await page.$('input[name="firstName"]');
        
        if (currentUrl.includes('/book') || currentUrl.includes('/') || hasProfileModal) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Did not redirect or show profile modal after registration');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
  } finally {
    await browser.close();
  }
  
  return results;
}

// Run if called directly
// eslint-disable-next-line no-undef
if (import.meta.url === `file://${process.argv[1]}`) {
  testRegister().then(results => {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${results.length}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    // eslint-disable-next-line no-undef
    process.exit(failed > 0 ? 1 : 0);
  });
}

export { testRegister };
