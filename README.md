# Mowzaic

Mowzaic is a lawn-care booking and provider-management application. This repository brings together the customer web app, an Express API, serverless authentication handlers, and a Flutter provider app.

The code includes booking, payment, property, estimate, and provider workflows. It is still in development: database setup requires review, the local web app needs both API layers for authentication, and the mobile directory needs its native build scaffolding completed before it can be built as an Android or iOS app.

## Components and implemented workflows

| Component | Responsibilities |
| --- | --- |
| [mowzaic_frontend](mowzaic_frontend) | React 19 / Vite customer and provider interface: authentication, property management, bookings, checkout, provider registration/dashboard, and Mapbox address entry. |
| [mowzaic_backend](mowzaic_backend) | Express API for properties, bookings and status changes, estimates, subscriptions, Stripe checkout/webhooks, and provider jobs/customers. Uses Supabase for data and authentication verification. |
| [api](api) | Serverless handlers for Supabase login, session refresh, logout/session setup, and service-demand tracking. These are separate from the Express process. |
| [mowzaic_provider](mowzaic_provider) | Flutter field-app source: today's stops, current job details/completion, map pins, claiming available paid jobs, customer roster, and settings. |

The web app calls the root `/api/auth/*` handlers on its own origin for session management, talks to Supabase, and uses the Express backend for business operations. The Flutter app signs in with Supabase and sends its access token to the Express API. The root [vercel.json](vercel.json) builds the web app and includes the serverless handlers; the long-running Express API is a separate service.

## Prerequisites

- Node.js and npm compatible with the frontend's Vite 6 dependency. The component README recommends Node.js 20 or later; this repository does not pin a Node version.
- A Supabase project with the application's tables, policies, and booking functions.
- Stripe test credentials for payment workflows and a Mapbox token for address/maps features.
- Vercel CLI for exercising the root serverless handlers locally.
- For mobile development, a Flutter installation whose bundled Dart SDK satisfies `>=3.3.0 <4.0.0`, plus the target platform's tooling. That range is the **Dart** constraint in [pubspec.yaml](mowzaic_provider/pubspec.yaml).

## Web and backend setup

All commands in this section start at the repository root unless stated otherwise.

### 1. Install dependencies

```bash
npm run install:all
npm --prefix api install
```

`install:all` installs the frontend and Express backend packages. The second command installs the root serverless handlers' separate dependencies. The root package is a command wrapper, not an npm-workspaces configuration.

### 2. Configure environment variables

```bash
cp mowzaic_frontend/.env.example mowzaic_frontend/.env
cp mowzaic_backend/.env.example mowzaic_backend/.env
```

Fill in values using the [frontend template](mowzaic_frontend/.env.example) and [backend template](mowzaic_backend/.env.example).

| Scope | Variables | Purpose |
| --- | --- | --- |
| Browser | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase project and public client key. |
| Browser | `VITE_MODE`, `VITE_API_URL`, `VITE_APP_URL` | Development mode, Express API URL, and web origin used by OAuth. |
| Browser | `VITE_MAPBOX_TOKEN`, `VITE_STRIPE_PUBLISHABLE_KEY` | Public Mapbox and Stripe configuration. |
| Express | `PORT`, `MODE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Service port, environment, and Supabase access. |
| Express payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_RECURRING_SERVICE_ID` | Stripe configuration for the payment/subscription workflows. |
| Root serverless handlers | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MODE`; `SUPABASE_SERVICE_ROLE_KEY` for demand tracking | Server-side Supabase/session and demand-tracking configuration. |

For local web development, use backend `PORT=3000` and `MODE=development`, frontend `VITE_MODE=development`, and an appropriate `VITE_APP_URL` for the web origin you are using. In development mode, [constants.js](mowzaic_frontend/src/constants.js) currently hardcodes the Express URL to `http://localhost:3000`; changing `VITE_API_URL` alone will not change that local URL.

The backend entry point attempts to load `.env.development` for `npm run dev` and `.env` in production. However, imported modules such as [db.js](mowzaic_backend/db.js) call `dotenv.config()` earlier and read `.env`. Keep startup credentials in `mowzaic_backend/.env` or the process environment; a `.env.development` file alone is not a reliable bootstrap with the current import order.

The templates also include legacy JWT and OAuth variables. Current request authentication in [middleware.js](mowzaic_backend/middleware.js) validates Supabase access tokens through `supabase.auth.getUser()`. Older JWT setup notes describe a previous implementation.

Only public configuration belongs in `VITE_*` variables. Service-role keys, Stripe secret keys, and other server credentials must remain server-side. Configure the root serverless runtime separately; the frontend's nested `.env` should not be assumed to configure root functions.

### 3. Prepare the database

The repository contains several schema snapshots and SQL scripts rather than a single tracked migration command. Review them against the intended Supabase project before applying changes:

- [mowzaic_backend/initdb.sql](mowzaic_backend/initdb.sql) contains the application's tables and functions, but also contains **active `DROP` statements**. Use a disposable development database for a fresh bootstrap; do not run it against existing data without reviewing those statements.
- [create_booking_functions.sql](mowzaic_backend/sql/create_booking_functions.sql) defines the `check_and_create_property` and `create_full_booking_transaction` functions used by booking routes.
- [add_provider_clients.sql](mowzaic_backend/sql/add_provider_clients.sql) adds the provider customer-roster table and policies.

Older schema files also exist under `mowzaic_backend/sql` and the frontend. Do not apply every SQL file indiscriminately. Provider routes require a corresponding `public.users` row with a `provider` or `admin` role.

### 4. Run the Express backend

```bash
npm run dev:backend
```

The configured local API runs at `http://localhost:3000`; `GET /health` is its health endpoint. Stripe's webhook route is `/webhook` and needs its own configured signing secret/forwarding setup for payment testing.

### 5. Run the web app

For UI work that does not need the root serverless functions, open another terminal:

```bash
npm run dev:frontend
```

Vite normally serves `http://localhost:5173`. This command alone does **not** serve `/api/auth/*`, so it is insufficient for the complete login/session workflow.

For authentication and demand tracking, run the repository through the [Vercel development runtime](https://vercel.com/docs/cli/dev) instead of starting a separate frontend process:

```bash
vercel dev --listen 3001
```

Run that command from the repository root with the appropriate development environment configured for the root functions. Set their `MODE=development` for local cookie behavior, set frontend `VITE_APP_URL=http://localhost:3001`, and open `http://localhost:3001`. Keep Express running on port `3000`; the current development CORS list permits web origins on `5173` and `3001`.

The root `npm run dev` convenience script starts Express and plain Vite together. It does not add the serverless runtime. Payment redirect URLs still include `http://localhost:5173` in backend development code, so review that setting when testing checkout through the `3001` origin.

## Flutter provider app

The [provider README](mowzaic_provider/README.md) describes the screens and API endpoints. Its configuration is read using Dart `String.fromEnvironment`, so copying `.env.example` to `.env` does not inject values into the app.

The checked-in directory currently lacks complete Android/iOS project scaffolding and the `assets/` directory declared in `pubspec.yaml`. Restore or generate those files before a native build, preserving the supplied platform permission entries. Once the project scaffold and platform tooling are ready:

```bash
cd mowzaic_provider
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-public-anon-key \
  --dart-define=API_BASE_URL=https://your-development-api.example \
  --dart-define=MAPBOX_ACCESS_TOKEN=your-public-mapbox-token
```

Use an API address reachable from the device or emulator. The provider app calls the Express routes under `/providers` and `/book`; `API_BASE_URL` should point to that service. The map displays job locations; route optimization and turn-by-turn navigation are not established by this implementation.

## Build, lint, and tests

From the repository root:

```bash
npm run build:frontend
npm run lint:frontend
```

Browser tests are available in [mowzaic_frontend/tests](mowzaic_frontend/tests). With the web runtime, Express API, database, and test account configured:

```bash
npm --prefix mowzaic_frontend run test:e2e
npm --prefix mowzaic_frontend run test:demand
```

The E2E runner covers login, registration, and secure-cookie tests; demand tracking has its own script. Set `TEST_URL` to the actual web origin, `BACKEND_URL` to the Express origin, and `FOREVER_TEST_EMAIL` / `FOREVER_TEST_PASSWORD` to a dedicated test account in `mowzaic_frontend/.env`. The tests' default `TEST_URL` is port `3000`, which conflicts with the normal Express port, so set it explicitly. `HEADLESS` and `SLOW_MO` control browser behavior. Registration tests can create test users.

The backend declares `lint` and `test` scripts, but its manifest does not declare ESLint/Jest dependencies and no backend test suite is checked in. Those scripts should not be treated as a working backend verification setup. The provider package declares `flutter_test`, but there is no checked-in provider test suite.

## Current limitations

- Local setup spans Vite/Vercel, Express, Supabase, Stripe, and Mapbox; there is no single command that provisions all dependencies or migrates the database.
- Booking availability currently uses a fixed limit of 10 bookings per day. It is not calculated from provider capacity, job duration, or travel time.
- The mobile source needs native project scaffolding/assets before native builds, and the displayed itinerary/map is not a routing optimizer.
- Several component guides predate the current monorepo paths and authentication implementation. Use the paths, manifests, and source linked here when older examples differ.

## Further documentation

- [Frontend overview](mowzaic_frontend/README.md)
- [Backend API documentation](mowzaic_backend/API_DOCUMENTATION.md)
- [Frontend API documentation](mowzaic_frontend/API_DOCUMENTATION.md)
- [Browser test guide](mowzaic_frontend/tests/README.md)
- [Provider app guide](mowzaic_provider/README.md)

