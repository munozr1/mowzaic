import puppeteer from 'puppeteer';
import { TEST_CONFIG, captureScreenshot, clickButtonByText, typeInField, delay } from '../config.js';

async function testLogin() {
  console.log('🧪 Starting Login Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.HEADLESS,
    slowMo: TEST_CONFIG.SLOW_MO,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    // Test 1: Open login modal
    {
      const testName = 'Open Login Modal';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        // Click sign in button
        await clickButtonByText(page, 'sign in to book service');
        
        // Wait for modal to appear
        await page.waitForSelector('input[name="email"]', { timeout: 3000 });
        
        const modalVisible = await page.$('input[name="email"]');
        
        if (modalVisible) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Modal did not appear');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 2: Login with valid credentials
    {
      const testName = 'Login with Valid Credentials';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        // Open modal
        await clickButtonByText(page, 'or sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Fill in credentials
        await typeInField(page, 'input[name="email"]', TEST_CONFIG.FOREVER_TEST_USER.email);
        await typeInField(page, 'input[name="password"]', TEST_CONFIG.FOREVER_TEST_USER.password);
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for redirect to /book
        await page.waitForFunction(
          () => window.location.pathname === '/book' || window.location.pathname === '/manage',
          { timeout: TEST_CONFIG.TIMEOUT.NAVIGATION }
        );

        // Log out after successful login
        await clickButtonByText(page, 'logout');
        
        // Wait for redirect to landing page
        await page.waitForFunction(
          () => window.location.pathname === '/',
          { timeout: TEST_CONFIG.TIMEOUT.NAVIGATION }
        );
        
        // Verify we're back on landing page (sign in button should be visible)
        await page.waitForSelector('button', { timeout: 3000 });

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
    
    // Test 3: Login with invalid credentials
    {
      const testName = 'Login with Invalid Credentials';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        // Open modal
        await clickButtonByText(page, 'sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Fill in invalid credentials
        await typeInField(page, 'input[name="email"]', 'wrong@example.com');
        await typeInField(page, 'input[name="password"]', 'WrongPassword123!');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for error message
        await page.waitForSelector('.text-red-500', { timeout: 5000 });
        
        const errorVisible = await page.$('.text-red-500');
        
        if (errorVisible) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Error message not displayed');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 4: Close modal with X button
    {
      const testName = 'Close Login Modal';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        // Open modal
        await clickButtonByText(page, 'sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Click X button to close
        await page.evaluate(() => {
          const closeButton = document.querySelector('button svg')?.closest('button');
          if (closeButton) closeButton.click();
        });
        
        // Wait a bit for animation
        await delay(500);
        
        // Verify modal is closed
        const modalClosed = await page.evaluate(() => {
          const modal = document.querySelector('input[name="email"]');
          return modal === null;
        });
        
        if (modalClosed) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Modal did not close');
        }
      } catch (error) {
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
        await captureScreenshot(page, testName);
        results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
      } finally {
        await page.close();
      }
    }
    
    // Test 5: Close modal by clicking backdrop
    {
      const testName = 'Close Modal by Clicking Backdrop';
      console.log(`▶️  ${testName}`);
      const page = await browser.newPage();
      const start = Date.now();
      
      try {
        await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        
        // Open modal
        await clickButtonByText(page, 'sign in to book service');
        await page.waitForSelector('input[name="email"]');
        
        // Click backdrop (outside modal)
        await page.evaluate(() => {
          const backdrop = document.querySelector('.fixed.inset-0');
          if (backdrop) backdrop.click();
        });
        
        // Wait for modal to close
        await delay(500);
        
        const modalClosed = await page.evaluate(() => {
          const modal = document.querySelector('input[name="email"]');
          return modal === null;
        });
        
        if (modalClosed) {
          console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
          results.push({ name: testName, status: 'passed', duration: Date.now() - start });
        } else {
          throw new Error('Modal did not close when clicking backdrop');
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
  testLogin().then(results => {
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

export { testLogin };
