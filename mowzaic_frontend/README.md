# Mowzaic Frontend

A modern React application for lawn care service booking and management.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Vercel CLI (for local development with serverless functions)

### Installation

1. Clone the repository
```bash
git clone https://github.com/munozr1/mowzaic.git
cd mowzaic
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
- Get Supabase credentials from your Supabase project dashboard
- Get Stripe keys from your Stripe dashboard
- Get Mapbox token from your Mapbox account
- Generate JWT secrets: `openssl rand -base64 32`

4. Start the development server
```bash
npm run dev
```

For local testing with serverless functions:
```bash
vercel dev
```

Visit `http://localhost:5173`

## 📦 Environment Variables

This project uses multiple environment variables for configuration. See [`.env.example`](.env.example) for a complete list.

### Variable Types

**Frontend Variables (VITE_*)** - Exposed to browser:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_MAPBOX_TOKEN` - Mapbox API token
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `VITE_API_URL` - Backend API URL
- `VITE_APP_URL` - Frontend URL (for OAuth redirects)
- `VITE_MODE` - Application mode (development/production/test)

**Backend Variables** - Server-side only (Vercel functions):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (⚠️ SECRET)
- `STRIPE_SECRET_KEY` - Stripe secret key (⚠️ SECRET)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `ACCESS_TOKEN_SECRET` - JWT access token secret
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret
- `MODE` - Server mode (development/production/test)

**Test Variables** - For E2E testing:
- `FOREVER_TEST_EMAIL` - Test user email
- `FOREVER_TEST_PASSWORD` - Test user password
- `TEST_URL` - Frontend test URL
- `BACKEND_URL` - Backend test URL

### Environment Setup

**Local Development:**
1. Copy `.env.example` to `.env`
2. Fill in your values
3. Run `npm run dev` or `vercel dev`

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all `VITE_*` variables for frontend
3. Add all non-`VITE_*` variables for serverless functions
4. Deploy: `vercel --prod`

**GitHub Actions (CI/CD):**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add all secrets listed in [`.github/GITHUB_ACTIONS_SETUP.md`](.github/GITHUB_ACTIONS_SETUP.md)
3. See setup guide for detailed instructions

## 🧪 Testing

### E2E Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run specific test suites:
```bash
npm run test:login
npm run test:register
```

### Test Configuration

Tests use environment variables from `.env`:
- `FOREVER_TEST_EMAIL` - Permanent test user
- `FOREVER_TEST_PASSWORD` - Test user password
- `HEADLESS=false` - Show browser during tests

See [`tests/README.md`](tests/README.md) for more details.

## 🏗️ Project Structure

```
mowzaic_frontend/
├── api/                  # Vercel serverless functions
│   └── auth/            # Authentication endpoints
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── assets/         # Static assets
│   └── constants.js    # Environment variable exports
├── tests/              # E2E tests (Puppeteer)
├── .github/
│   └── workflows/      # GitHub Actions CI/CD
└── public/             # Public static files
```

## 🔐 Security Notes

1. **Never commit `.env` files** - They contain secrets
2. **Use `VITE_*` prefix only for public values** - These are exposed to the browser
3. **Serverless functions use non-`VITE_*` variables** - These stay server-side
4. **Rotate secrets regularly** - Especially JWT secrets and API keys
5. **Use test mode keys in development** - Stripe: `pk_test_*` / `sk_test_*`

## 📚 Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4
- **Authentication:** Supabase Auth with HTTP-only cookies
- **Payments:** Stripe Checkout
- **Maps:** Mapbox
- **Testing:** Puppeteer (E2E)
- **Deployment:** Vercel (serverless functions + static hosting)
- **CI/CD:** GitHub Actions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

For more information:
- [API Documentation](API_DOCUMENTATION.md)
- [GitHub Actions Setup](.github/GITHUB_ACTIONS_SETUP.md)
- [Test Documentation](tests/README.md)
