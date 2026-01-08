# Mowzaic E2E Testing Guide

## 📋 Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The app should be running on `http://localhost:5173`

3. **Backend running:**
   Make sure your backend is running on `http://localhost:3000`

---

## 🚀 Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Auth Tests Only
```bash
npm run test:auth
```

### Run Specific Test Suites
```bash
# Login tests
npm run test:login

# Registration tests
npm run test:register
```

---

## 🐛 Debugging Tests

### Watch Tests Run (Not Headless)
```bash
HEADLESS=false npm run test:login
```

### Slow Motion (for debugging)
```bash
SLOW_MO=100 HEADLESS=false npm run test:login
```

### Combine Options
```bash
HEADLESS=false SLOW_MO=200 npm run test:e2e
```

---

## 📸 Screenshots

Failed tests automatically capture screenshots to:
```
screenshots/Test-Name-YYYY-MM-DDTHH-MM-SS.png
```

---

## 📊 Test Results

After running tests, view results in:
```
test-results.json
```

Example:
```json
{
  "timestamp": "2026-01-07T12:34:56.789Z",
  "duration": 15234,
  "total": 10,
  "passed": 8,
  "failed": 2,
  "results": [...]
}
```

---

## 🧪 Current Test Coverage

### Auth Tests (10 tests)
- ✅ Open login modal
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Close modal with X button
- ✅ Close modal by clicking backdrop
- ✅ Switch to register mode
- ✅ Switch back to login mode
- ✅ Register with mismatched emails
- ✅ Register with mismatched passwords
- ✅ Register with valid data

---

## ⚙️ Configuration

Edit `tests/config.js` to customize:
```javascript
{
  BASE_URL: 'http://localhost:5173',
  BACKEND_URL: 'http://localhost:3000',
  HEADLESS: true,
  SLOW_MO: 0,
  TEST_USER: {
    email: 'test-user@mowzaic.com',
    password: 'TestPassword123!'
  }
}
```

---

## 📝 Test User Setup

Before running tests, create a test user in your database:
```sql
-- This user should exist for login tests to pass
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test-user@mowzaic.com', 'hashed_password', NOW());
```

Or register manually through the app first.

---

## 🔧 Troubleshooting

### Tests timing out?
- Increase timeout in `tests/config.js`:
  ```javascript
  TIMEOUT: {
    DEFAULT: 10000,  // Increase this
    NAVIGATION: 15000
  }
  ```

### Tests can't find elements?
- Run with `HEADLESS=false` to see what's happening
- Check screenshots in `screenshots/` folder
- Verify selectors in test files match your actual HTML

### Port conflicts?
- Change `BASE_URL` in `tests/config.js`
- Or set environment variable:
  ```bash
  TEST_URL=http://localhost:3000 npm run test:e2e
  ```

---

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:5173
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: screenshots/
```

---

## 📚 Adding New Tests

1. Create test file: `tests/[category]/[name].test.js`
2. Import utilities from `tests/config.js`
3. Export test function
4. Add to `tests/runner.js`

Example:
```javascript
import puppeteer from 'puppeteer';
import { TEST_CONFIG, captureScreenshot } from '../config.js';

async function testMyFeature() {
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.HEADLESS
  });
  
  const results = [];
  // ... your tests
  
  await browser.close();
  return results;
}

export { testMyFeature };
```
