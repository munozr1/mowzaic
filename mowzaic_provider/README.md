# Mowzaic Provider App

Flutter mobile app for Mowzaic lawn care service providers.

## Features

- **Current Stop** — Active job details: address, customer info, access codes, pets flag, mark complete
- **Itinerary List** — Ordered list of today's stops with progress summary
- **Map** — Mapbox map showing today's route with numbered stop pins
- **Settings** — Profile, logout
- **Available Jobs** — Claim unassigned paid bookings
- **Add Customer** — Add existing Mowzaic customers to your roster

## Getting Started

### 1. Prerequisites

- Flutter SDK ≥ 3.3.0
- A Supabase project with the Mowzaic schema
- Mapbox account with a public access token

### 2. Configure environment

```bash
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL, MAPBOX_ACCESS_TOKEN
```

### 3. Run the database migration

In your Supabase SQL editor, run:

```
mowzaic_backend/sql/add_provider_clients.sql
```

### 4. Install dependencies

```bash
flutter pub get
```

### 5. Run the app

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=API_BASE_URL=https://your-backend.vercel.app \
  --dart-define=MAPBOX_ACCESS_TOKEN=pk.eyJ...
```

### 6. Create a provider account

In Supabase Auth, register a user and set their role to `provider` in the `users` table, or pass `{ role: 'provider' }` in the user metadata during registration.

## Project Structure

```
lib/
├── main.dart              # Entry point, Supabase init, auth gate
├── config/
│   ├── theme.dart         # Green brand theme (#2EB966)
│   └── constants.dart     # dart-define env vars
├── models/                # Data models (Stop, Booking, Property, Customer)
├── services/
│   ├── auth_service.dart  # Supabase auth wrapper
│   └── api_service.dart   # HTTP client for backend API
├── providers/             # ChangeNotifier state
│   ├── auth_provider.dart
│   └── itinerary_provider.dart
├── screens/
│   ├── auth/login_screen.dart
│   ├── main_shell.dart         # Drawer + IndexedStack shell
│   ├── current_stop/
│   ├── itinerary/
│   ├── map/
│   ├── settings/
│   ├── customers/
│   └── jobs/
└── widgets/               # Reusable UI components
```

## Backend API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/providers/role` | Verify provider role |
| GET | `/providers/today` | Today's ordered stops |
| PATCH | `/book/status/:id` | Mark stop complete |
| GET | `/providers/available-jobs` | Unassigned jobs to claim |
| POST | `/providers/claim-job/:id` | Claim a job |
| GET | `/providers/customers` | Provider's customer roster |
| POST | `/providers/customers/add` | Add customer by email/phone |
