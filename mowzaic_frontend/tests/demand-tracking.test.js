import puppeteer from 'puppeteer';
import { TEST_CONFIG, captureScreenshot, typeInField, delay } from './config.js';

async function testDemandTracking() {
    console.log('🧪 Starting Demand Tracking Tests...\n');

    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.HEADLESS,
        slowMo: TEST_CONFIG.SLOW_MO,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    // Helper to select address
    async function selectAddress(page, addressQuery) {
        await typeInField(page, '#address-autofill-input', addressQuery);
        await page.waitForSelector('ul li', { timeout: 5000 });
        await delay(500); // Wait for list to settle
        await page.click('ul li:first-child');
    }

    try {
        // Test 1: Out of State Rejection
        {
            const testName = 'Out of State Rejection';
            console.log(`▶️  ${testName}`);
            const page = await browser.newPage();
            const start = Date.now();

            try {
                await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });

                await selectAddress(page, '2324 West Alexander Avenue, Shreveport');

                // Wait for Toast
                await page.waitForSelector('li[data-sonner-toast]', { timeout: 5000 });

                const toastText = await page.evaluate(() => {
                    const toast = document.querySelector('li[data-sonner-toast]');
                    return toast ? toast.innerText : '';
                });

                if (toastText.includes('waitlisted') && toastText.includes('Texas')) {
                    console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
                    results.push({ name: testName, status: 'passed', duration: Date.now() - start });
                } else {
                    throw new Error(`Unexpected toast message: ${toastText}`);
                }

            } catch (error) {
                console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
                await captureScreenshot(page, testName);
                results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
            } finally {
                await page.close();
            }
        }

        // Test 2: Out of County Rejection
        {
            const testName = 'Out of County Rejection';
            console.log(`▶️  ${testName}`);
            const page = await browser.newPage();
            const start = Date.now();

            try {
                await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });

                await selectAddress(page, '2324 Lubbock Street');

                // Wait for Toast
                await page.waitForSelector('li[data-sonner-toast]', { timeout: 5000 });

                const toastText = await page.evaluate(() => {
                    const toast = document.querySelector('li[data-sonner-toast]');
                    return toast ? toast.innerText : '';
                });

                if (toastText.includes('waitlisted') && toastText.includes('Dallas County')) {
                    console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
                    results.push({ name: testName, status: 'passed', duration: Date.now() - start });
                } else {
                    throw new Error(`Unexpected toast message: ${toastText}`);
                }

            } catch (error) {
                console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
                await captureScreenshot(page, testName);
                results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
            } finally {
                await page.close();
            }
        }

        // Test 3: Dallas Waitlist Flow (Booking Page Gate)
        {
            const testName = 'Dallas Waitlist Flow';
            console.log(`▶️  ${testName}`);
            const page = await browser.newPage();
            const start = Date.now();

            try {
                await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });

                // Use a Dallas zip
                await selectAddress(page, '2324 Sachse Road'); // Dallas

                // Verify Navigation to /book
                await page.waitForFunction(
                    () => window.location.pathname === '/book',
                    { timeout: TEST_CONFIG.TIMEOUT.NAVIGATION }
                );

                // Fill Form
                await typeInField(page, 'input[name="phoneNumber"]', '5551234567');

                // Click Book Now
                await page.click('button[type="submit"]');

                // Wait for Waitlist Toast
                await page.waitForSelector('li[data-sonner-toast]', { timeout: 5000 });

                const toastText = await page.evaluate(() => {
                    const toast = document.querySelector('li[data-sonner-toast]');
                    return toast ? toast.innerText : '';
                });

                // Verify stayed on /book
                const currentPath = await page.evaluate(() => window.location.pathname);

                if (toastText.includes('waitlisted') && currentPath === '/book') {
                    console.log(`✅ ${testName} - PASSED (${Date.now() - start}ms)\n`);
                    results.push({ name: testName, status: 'passed', duration: Date.now() - start });
                } else {
                    throw new Error(`Failed: Toast="${toastText}", Path="${currentPath}"`);
                }

            } catch (error) {
                console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
                await captureScreenshot(page, testName);
                results.push({ name: testName, status: 'failed', error: error.message, duration: Date.now() - start });
            } finally {
                await page.close();
            }
        }

        // Test 4: Success Flow (Mesquite)
        {
            const testName = 'Success Flow (Mesquite)';
            console.log(`▶️  ${testName}`);
            const page = await browser.newPage();
            const start = Date.now();

            try {
                await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });

                // Use a Mesquite zip
                await selectAddress(page, '4309 harvey dr '); // Mesquite

                // Verify Navigation to /book
                await page.waitForFunction(
                    () => window.location.pathname === '/book',
                    { timeout: TEST_CONFIG.TIMEOUT.NAVIGATION }
                );

                // Fill Form
                await typeInField(page, 'input[name="phoneNumber"]', '5551234567');

                // Click Book Now
                await page.click('button[type="submit"]');

                // We expect either:
                // 1. Login Modal (if unauthenticated)
                // 2. Navigation to checkout/thank-you (if validated logic proceeds differently)

                // Based on the code, unauthenticated user gets login modal
                // authenticated user gets processed.
                // Since we are unauthenticated in fresh browser, we expect login modal OR 
                // if logic allows submission without auth for specific cases (not the case here, NewBookingPage requires auth).

                // Checking NewBookingPage.jsx: 
                // if (!isAuthenticated) { ... openLoginModal(); return; }

                // So we expect the login modal to appear.
                await page.waitForSelector('input[name="email"]', { timeout: 5000 });

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

    } finally {
        await browser.close();
    }

    return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testDemandTracking().then(results => {
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;

        console.log('\n📊 Test Summary:');
        console.log(`   Total: ${results.length}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);

        process.exit(failed > 0 ? 1 : 0);
    });
}

export { testDemandTracking };
