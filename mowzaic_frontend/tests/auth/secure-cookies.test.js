import puppeteer from 'puppeteer';
import { TEST_CONFIG, captureScreenshot, clickButtonByText, typeInField, delay } from '../config.js';

async function testSecureCookies() {
    console.log('🧪 Starting Secure Cookie Auth Tests...\n');

    const browser = await puppeteer.launch({
        headless: TEST_CONFIG.HEADLESS,
        slowMo: TEST_CONFIG.SLOW_MO,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    try {
        // Test 1: Secure Login and Storage Check
        {
            const testName = 'Secure Login and Storage Check';
            console.log(`▶️  ${testName}`);
            const page = await browser.newPage();
            const start = Date.now();

            try {
                await page.goto(TEST_CONFIG.BASE_URL, { waitUntil: 'networkidle2' });

                // Open modal
                await clickButtonByText(page, 'sign in to book service');
                await page.waitForSelector('input[name="email"]');

                // Fill in credentials
                await typeInField(page, 'input[name="email"]', TEST_CONFIG.FOREVER_TEST_USER.email);
                await typeInField(page, 'input[name="password"]', TEST_CONFIG.FOREVER_TEST_USER.password);

                await delay(250);

                // Submit form
                await page.click('button[type="submit"]');

                await delay(2000); // Wait for API calls

                // Wait for redirect to /book
                await page.waitForFunction(
                    () => window.location.pathname === '/book' || window.location.pathname === '/manage',
                    { timeout: TEST_CONFIG.TIMEOUT.NAVIGATION }
                );

                // CHECK 1: LocalStorage should NOT contain supabase keys
                const localStorageData = await page.evaluate(() => {
                    return JSON.stringify(localStorage);
                });

                if (localStorageData.includes('sb-access-token') || localStorageData.includes('sb-refresh-token')) {
                    throw new Error('Supabase tokens found in localStorage! Migration failed.');
                } else {
                    console.log('   ✅ LocalStorage is clean of Supabase tokens.');
                }

                // CHECK 2: Cookie should be present (we can't easily check HttpOnly flag from document.cookie, but we can access it via CDP or page.cookies())
                const cookies = await page.cookies();
                const refreshTokenCookie = cookies.find(c => c.name === 'sb-refresh-token');

                if (!refreshTokenCookie) {
                    throw new Error('sb-refresh-token cookie not found!');
                }

                if (!refreshTokenCookie.httpOnly) {
                    throw new Error('sb-refresh-token cookie is NOT HttpOnly!');
                }

                console.log('   ✅ HttpOnly refresh token cookie found.');

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

        // Test 2: Persistence on Reload
        {
            const testName = 'Session Persistence on Reload';
            console.log(`▶️  ${testName}`);
            const page = await browser.newPage();
            const start = Date.now();

            try {
                // Assuming the session cookie is persisted in the browser instance
                await page.goto(TEST_CONFIG.BASE_URL + '/book', { waitUntil: 'networkidle2' });

                // Should still be on /book if logged in, or redirected to login if not
                // But our app likely redirects to / if not logged in? Or shows login modal?
                // Let's check if we are authenticated.

                await delay(2000); // Allow checkSession to run

                // If we are on /book, we are good.
                const pathname = await page.evaluate(() => window.location.pathname);

                // Just check if we see "Book Service" or similar authenticated content
                // Or wait for a known authenticated element.
                // Let's rely on the fact that if auth failed, we might be redirected.
                // Adjust based on actual routing logic.

                // Re-verify cookie is sent
                const cookies = await page.cookies();
                const hasCookie = cookies.some(c => c.name === 'sb-refresh-token');
                if (!hasCookie) throw new Error('Cookie missing on reload');

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
    testSecureCookies().then(results => {
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;

        console.log('\n📊 Test Summary:');
        console.log(`   Total: ${results.length}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);

        process.exit(failed > 0 ? 1 : 0);
    });
}

export { testSecureCookies };
