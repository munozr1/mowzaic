# GitHub Actions Setup Guide

## 🔐 Required GitHub Secrets

Before running tests in GitHub Actions, you need to configure secrets in your repository.

### Setting Up Secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

---

## 🔑 Required Secrets

### Authentication & Test User

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `FOREVER_TEST_EMAIL` | Email for the permanent test user account | `test@mowzaic.com` |
| `FOREVER_TEST_PASSWORD` | Password for the test user | `SecureTestPass123!` |

### Backend Repository Access

| Secret Name | Description | How to Create |
|-------------|-------------|---------------|
| `BACKEND_REPO_PAT` | Personal Access Token to checkout private backend repo | See instructions below |

### Test Database (Supabase)

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `SUPABASE_URL_TEST` | Test Supabase project URL | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY_TEST` | Service role key for test project | Project Settings → API → service_role key |
| `TEST_DATABASE_URL` | PostgreSQL connection string for backend | Project Settings → Database → Connection string |

### Stripe Test Keys

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `STRIPE_TEST_SECRET_KEY` | Stripe test mode secret key | Stripe Dashboard → Developers → API keys |
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe test webhook signing secret | Stripe Dashboard → Developers → Webhooks |

---

## 🎫 Creating a GitHub Personal Access Token (PAT)

The workflow needs access to your private backend repository. Follow these steps:

1. Go to **GitHub.com** → Click your profile photo → **Settings**
2. Scroll down and click **Developer settings** (left sidebar)
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**
5. Give it a descriptive name: `GitHub Actions - Backend Access`
6. Set expiration: Choose **90 days** or **No expiration** (requires admin approval)
7. **Select scopes:**
   - ✅ **repo** (Full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
8. Click **Generate token**
9. **⚠️ COPY THE TOKEN IMMEDIATELY** - You won't be able to see it again!
10. Add it to your repository secrets as `BACKEND_REPO_PAT`

---

## 🗄️ Setting Up Test Supabase Project

Create a separate Supabase project for testing to avoid polluting production data:

### 1. Create Test Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **New Project**
3. Name: `mowzaic-test` (or similar)
4. Database Password: Generate a strong password
5. Region: Same as production
6. Click **Create new project**

### 2. Run Database Migrations
1. Copy your database schema from production
2. Apply it to the test project via SQL Editor
3. Or use migration tools if you have them set up

### 3. Get Connection Details
- **SUPABASE_URL_TEST**: Project Settings → API → Project URL
- **SUPABASE_SERVICE_ROLE_KEY_TEST**: Project Settings → API → service_role (secret)
- **TEST_DATABASE_URL**: Project Settings → Database → Connection string (URI format)

---

## 📝 Creating the Test User

Before running tests, you need to create a permanent test user in your Supabase database:

### Option 1: Via Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Email: Use the same email you set in `FOREVER_TEST_EMAIL`
4. Password: Use the same password you set in `FOREVER_TEST_PASSWORD`
5. **Check "Auto Confirm User"** to skip email verification

### Option 2: Via SQL
```sql
-- Insert test user directly (replace with your values)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@mowzaic.com',  -- Your FOREVER_TEST_EMAIL
  crypt('SecureTestPass123!', gen_salt('bf')),  -- Your FOREVER_TEST_PASSWORD
  NOW(),
  NOW(),
  NOW()
);
```

---

## 🚀 Running Tests Locally

### Prerequisites:
1. Backend server running on `http://localhost:3000`
2. Frontend dev server running on `http://localhost:5173`
3. Test user exists in Supabase with credentials below

### With Environment Variables:
```bash
FOREVER_TEST_EMAIL=test@mowzaic.com \
FOREVER_TEST_PASSWORD=SecureTestPass123! \
npm run test:e2e
```

### Or create `.env.test`:
```bash
cp .env.test.example .env.test
```

Then edit `.env.test`:
```bash
TEST_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
FOREVER_TEST_EMAIL=test@mowzaic.com
FOREVER_TEST_PASSWORD=SecureTestPass123!
HEADLESS=true
SLOW_MO=0
```

---

## ✅ Complete Setup Checklist

Before pushing to GitHub, make sure you have:

- [ ] Created a GitHub Personal Access Token with `repo` scope
- [ ] Added `BACKEND_REPO_PAT` to GitHub Secrets
- [ ] Created a test Supabase project
- [ ] Added Supabase secrets: `SUPABASE_URL_TEST`, `SUPABASE_SERVICE_ROLE_KEY_TEST`, `TEST_DATABASE_URL`
- [ ] Created test user in Supabase
- [ ] Added test user credentials: `FOREVER_TEST_EMAIL`, `FOREVER_TEST_PASSWORD`
- [ ] Added Stripe test keys: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`
- [ ] Verified backend has a `/health` endpoint that returns 200 OK
- [ ] Tested workflow locally by running both servers and tests

---

## 🔄 Workflow Triggers

Tests will run automatically on:
- ✅ Push to `main` branch
- ✅ Push to `develop` branch
- ✅ Pull requests to `main` or `develop`
- ✅ Manual trigger (Actions tab → "E2E Tests" → "Run workflow")

---

## 📊 Viewing Test Results

After tests run:
1. Go to **Actions** tab in your repository
2. Click on the workflow run
3. View test results in the job logs
4. Download artifacts:
   - `test-results`: JSON file with detailed results
   - `test-screenshots`: Screenshots of failed tests (only on failure)

On Pull Requests, a comment will automatically be posted with test results summary.

---

## 🐛 Troubleshooting

### Backend checkout fails
- **Error**: "repository not found" or "HTTP 404"
- **Solution**: Verify `BACKEND_REPO_PAT` has `repo` scope and hasn't expired
- **Check**: Token must have access to `munozr1/mowzaic_backend`

### Backend won't start
- **Check**: Backend `package.json` has a `start` script
- **Check**: All required environment variables are set in workflow
- **Check**: Database connection string is valid

### Backend health check times out
- **Error**: "wait-on http://localhost:3000/health --timeout 60000" fails
- **Solution**: Verify backend has `/health` endpoint
- **Solution**: Check if backend is crashing (review logs in Actions)

### Tests fail with "User not found" error
- Make sure the test user exists in **test** Supabase project (not production!)
- Verify the email/password in GitHub Secrets match the user
- Check `SUPABASE_URL_TEST` points to correct project

### Tests timeout or network errors
- Check if backend is accessible at `http://localhost:3000`
- Verify backend is connected to test database
- Review workflow logs for connection errors

### Puppeteer/Chrome errors
- The workflow installs Chrome automatically
- Check if `npx puppeteer browsers install chrome` step succeeded
- Verify `HEADLESS=true` is set in workflow

### Database connection errors
- **Error**: "connect ECONNREFUSED" or "invalid connection string"
- **Solution**: Check `TEST_DATABASE_URL` format and credentials
- **Format**: `postgresql://user:password@host:port/database`

---

## 🔒 Security Notes

- **Never commit secrets to the repository**
- Personal Access Tokens should be kept secure and rotated regularly
- Test database should be separate from production
- Test Stripe keys should be in test mode, not live mode
- Consider setting PAT expiration to 90 days and renewing regularly

---

## 📦 Next Steps

After setup:
1. Push changes to GitHub
2. Check Actions tab to see if workflow runs
3. If tests fail, check artifacts for screenshots and logs
4. Update secrets if needed
5. Add more test suites (booking, payments, subscriptions)
