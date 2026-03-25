import { testLogin } from './auth/login.test.js';
import { testRegister } from './auth/register.test.js';
import { testSecureCookies } from './auth/secure-cookies.test.js';
import fs from 'fs';

async function runAllTests() {
  console.log('🚀 Mowzaic E2E Test Suite\n');
  console.log('='.repeat(50) + '\n');

  const allResults = [];
  const startTime = Date.now();

  // Run auth tests
  console.log('📁 Auth Tests');
  console.log('-'.repeat(50));

  try {
    const loginResults = await testLogin();
    allResults.push(...loginResults);
  } catch (error) {
    console.error('Login tests crashed:', error.message);
  }

  console.log('-'.repeat(50) + '\n');

  try {
    const registerResults = await testRegister();
    allResults.push(...registerResults);
  } catch (error) {
    console.error('Register tests crashed:', error.message);
  }

  console.log('-'.repeat(50) + '\n');

  try {
    const secureCookiesResults = await testSecureCookies();
    allResults.push(...secureCookiesResults);
  } catch (error) {
    console.error('Secure Cookie tests crashed:', error.message);
  }

  const totalTime = Date.now() - startTime;

  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    duration: totalTime,
    total: allResults.length,
    passed: allResults.filter(r => r.status === 'passed').length,
    failed: allResults.filter(r => r.status === 'failed').length,
    results: allResults
  };

  // Save results to JSON
  fs.writeFileSync(
    'test-results.json',
    JSON.stringify(summary, null, 2)
  );

  // Print final summary
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Final Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests:  ${summary.total}`);
  console.log(`✅ Passed:     ${summary.passed}`);
  console.log(`❌ Failed:     ${summary.failed}`);
  console.log(`⏱️  Duration:   ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📊 Pass Rate:  ${summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0}%`);
  console.log('\n📄 Results saved to test-results.json');

  if (summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    allResults
      .filter(r => r.status === 'failed')
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  process.exit(summary.failed > 0 ? 1 : 0);
}

runAllTests();
