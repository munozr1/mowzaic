# Mowzaic Backend API Documentation

**Base URL (Development):** `http://localhost:3000`  
**Base URL (Production):** `https://api.mowzaic.com`

**Authentication:** Most endpoints require authentication via Supabase JWT token. The token can be provided in two ways:

1. **HTTP-only Cookie** (Preferred):
   ```
   Cookie: sb-access-token=<supabase_jwt_token>
   ```
   This is automatically set by the frontend after successful Supabase authentication.

2. **Authorization Header** (Fallback):
   ```
   Authorization: Bearer <supabase_jwt_token>
   ```

The backend verifies the JWT signature using the `SUPABASE_JWT_SECRET` and extracts user information from the token payload.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Bookings](#bookings)
3. [Properties](#properties)
4. [Providers/Estimates](#providersestimates)
5. [Stripe/Payments](#stripepayments)
6. [Subscriptions](#subscriptions)
7. [Error Handling](#error-handling)

---

## Authentication

> **⚠️ DEPRECATED ENDPOINTS**  
> The `/register`, `/login`, `/refresh`, and `/logout` endpoints below are **DEPRECATED** and maintained only for backward compatibility.
> 
> **Current Authentication Flow:**
> - Frontend uses **Supabase Auth** (Google OAuth, Email/Password via Supabase)
> - Supabase issues JWT tokens stored in HTTP-only cookies (`sb-access-token`)
> - Backend verifies JWT tokens using `SUPABASE_JWT_SECRET`
> - No custom JWT generation on backend
> 
> For new implementations, use Supabase authentication on the frontend. The backend will automatically verify tokens from cookies or Authorization headers.

---

### Register New User (DEPRECATED)
**Endpoint:** `POST /register`  
**Status:** ⚠️ DEPRECATED - Use Supabase Auth instead  
**Auth Required:** No  
**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"
}
```
**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated"
  }
}
```
**Errors:**
- `400` - Missing required fields or email/phone already in use
- `500` - Database error

---

### Login (DEPRECATED)
**Endpoint:** `POST /login`  
**Status:** ⚠️ DEPRECATED - Use Supabase Auth instead  
**Auth Required:** No  
**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Success Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "jwt_token_here"
}
```
**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Database error

---

### Refresh Token (DEPRECATED)
**Endpoint:** `POST /refresh`  
**Status:** ⚠️ DEPRECATED - Supabase handles token refresh automatically  
**Auth Required:** Refresh token in cookie  
**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "new_jwt_token"
}
```
**Errors:**
- `401` - No refresh token or invalid token
- `500` - Database error

---

### Logout (DEPRECATED)
**Endpoint:** `POST /logout`  
**Status:** ⚠️ DEPRECATED - Use Supabase signOut() on frontend  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## Bookings

### Get Availability (This Week)
**Endpoint:** `GET /book/availability/this-week`  
**Auth Required:** No  
**Success Response (200):**
```json
[
  "2026-01-02T00:00:00.000Z",
  "2026-01-03T00:00:00.000Z",
  "2026-01-05T00:00:00.000Z"
]
```
**Description:** Returns available booking dates for the next 14 days, excluding unavailable days (weekends) and days that have reached maximum bookings (10 per day).

---

### Create Booking
**Endpoint:** `POST /book`  
**Auth Required:** Yes  
**Body:**
```json
{
  "selectedAddress": {
    "address": "123 Main St",
    "city": "Dallas",
    "state": "Texas",
    "postal": "75001",
    "coordinates": [-96.7970, 32.7767]
  },
  "selectedDate": {
    "bookingDate": "2026-01-05T10:00:00.000Z"
  },
  "message": "Please be careful around the garden",
  "codes": [{"id": 1, "code": "1234", "label": "Gate Code"}],
  "hasPets": true
}
```
**Success Response (201):**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "customer_id": "uuid",
    "property_id": "uuid",
    "date_of_service": "2026-01-05T10:00:00.000Z",
    "service_status": "scheduled",
    "payment_status": "pending",
    "provider_id": null,
    "subscription_id": 123,
    "message_id": 456
  }
}
```
**Errors:**
- `400` - Missing required fields or invalid data structure
- `401` - Unauthorized (missing/invalid token)
- `404` - User not found
- `500` - Database error (property creation, booking transaction failed)

**Notes:**
- Uses RPC function `check_and_create_property` to handle property creation/association
- Uses RPC function `create_full_booking_transaction` to atomically create estimate, subscription, message, and booking
- First-time service is always $35 (guaranteed pricing)

---

### Get Booking by ID
**Endpoint:** `GET /book/:id`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "property_id": "uuid",
  "date_of_service": "2026-01-05T10:00:00.000Z",
  "service_status": "scheduled",
  "payment_status": "pending",
  "provider_id": null,
  "subscription_id": 123,
  "message_id": 456,
  "date_booked": "2026-01-01T12:00:00.000Z"
}
```
**Errors:**
- `400` - Missing booking ID
- `401` - Unauthorized
- `404` - Booking not found
- `500` - Database error

---

### Get Booking Status
**Endpoint:** `GET /book/status/:id`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "payment_status": "pending"
}
```
**Errors:**
- `401` - Unauthorized
- `404` - Booking not found (0 rows returned due to RLS)
- `500` - Database error

**Note:** RLS policies restrict users to only see their own bookings (customer) or assigned bookings (provider).

---

### Update Booking Status
**Endpoint:** `PATCH /book/status/:id`  
**Auth Required:** Yes (Provider only)  
**Body:**
```json
{
  "service_status": "completed"
}
```
**Success Response (200):**
```json
{
  "message": "Status updated successfully",
  "data": {
    "id": "uuid",
    "service_status": "completed",
    "subscription": 123,
    "property_id": "uuid",
    "customer_id": "uuid"
  }
}
```
**Errors:**
- `401` - Unauthorized
- `500` - Database error

**Valid service_status values:** `scheduled`, `completed`, `canceled`

---

### Cancel Booking
**Endpoint:** `PATCH /book/cancel/:id`  
**Auth Required:** Yes (Customer only - must own the booking)  
**Body:** None  
**Success Response (200):**
```json
{
  "message": "Booking canceled successfully",
  "booking": {
    "id": "uuid",
    "customer_id": "uuid",
    "service_status": "canceled",
    "payment_status": "canceled",
    "date_of_service": "2026-01-05T10:00:00.000Z"
  }
}
```
**Errors:**
- `400` - `CANCELLATION_TOO_LATE` - Cannot cancel on day of service or after
- `400` - Booking already canceled or completed
- `401` - Unauthorized
- `404` - Booking not found or user does not own it
- `500` - Database error

**Cancellation Rules:**
- Must cancel at least 1 day before service date
- Cannot cancel on day of service (no refund will be issued)
- Cannot cancel already completed bookings
- Only the customer who created the booking can cancel it

**Error Response for Same-Day Cancellation:**
```json
{
  "error": {
    "code": "CANCELLATION_TOO_LATE",
    "message": "Bookings cannot be canceled on the day of service or after. Please contact support for assistance."
  }
}
```

---

## Properties

### Get All User Properties
**Endpoint:** `GET /properties`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "properties": [
    {
      "property_id": "uuid",
      "city": "Dallas",
      "state": "Texas",
      "postal": "75001",
      "address": "123 Main St",
      "has_pets": true,
      "coordinates": "(-96.7970,32.7767)",
      "codes": [{"id": 1, "code": "1234", "label": "Gate Code"}]
    }
  ]
}
```
**Errors:**
- `401` - Unauthorized
- `500` - Database error

**Notes:**
- Only returns active properties (deleted_at IS NULL)
- Properties are filtered by user_id via user_properties join table

---

### Get Property by ID
**Endpoint:** `GET /properties/:id`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "id": "uuid",
  "city": "Dallas",
  "state": "Texas",
  "postal": "75001",
  "address": "123 Main St",
  "has_pets": true,
  "coordinates": "(-96.7970,32.7767)",
  "codes": [{"id": 1, "code": "1234", "label": "Gate Code"}]
}
```
**Errors:**
- `400` - Missing property ID
- `401` - Unauthorized
- `404` - Property not found or not associated with user
- `500` - Database error

---

### Create or Associate Property
**Endpoint:** `POST /properties`  
**Auth Required:** Yes  
**Body:**
```json
{
  "address": "123 Main St",
  "city": "Dallas",
  "state": "Texas",
  "postal": "75001",
  "has_pets": true,
  "coordinates": [-96.7970, 32.7767],
  "codes": [{"id": 1, "code": "1234", "label": "Gate Code"}]
}
```
**Success Response (200 or 201):**
```json
{
  "property": {
    "id": "uuid",
    "address": "123 Main St",
    "city": "Dallas",
    "state": "Texas",
    "postal": "75001",
    "has_pets": true,
    "coordinates": "(-96.7970,32.7767)",
    "codes": [{"id": 1, "code": "1234", "label": "Gate Code"}]
  }
}
```
**Errors:**
- `400` - Missing required fields or property already associated with another user
- `401` - Unauthorized
- `500` - Database error

**Notes:**
- If property exists and user already has active association → returns 200
- If property exists but no association → creates new association
- If property doesn't exist → creates property and association
- Soft-deleted associations are NOT restored; new associations are always created

---

### Delete/Disassociate Property
**Endpoint:** `DELETE /properties/:id`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "message": "Property disassociated successfully"
}
```
**Errors:**
- `400` - Missing property ID or active subscriptions exist
- `401` - Unauthorized
- `404` - Property not found or not associated with user
- `500` - Database error

**Notes:**
- Soft delete (sets deleted_at timestamp)
- Cannot delete if active subscriptions exist for the property
- Logs event to events table for analytics

---

## Providers/Estimates

### Create Estimate
**Endpoint:** `POST /providers/create-estimate`  
**Auth Required:** Yes (Admin/Provider only - not enforced yet)  
**Body:**
```json
{
  "propertyId": "uuid",
  "priceCents": 5000
}
```
**Success Response (200):**
```json
{
  "id": 123,
  "property_id": "uuid",
  "price_cents": 5000,
  "accepted": "pending",
  "released": false,
  "released_at": null,
  "created_at": "2026-01-01T12:00:00.000Z"
}
```
**Errors:**
- `400` - Missing propertyId or priceCents
- `401` - Unauthorized
- `500` - Database error

**Notes:**
- Used by providers after completing first-time service to set custom pricing for larger properties
- Default first-time service is always $35
- Estimate status defaults to 'pending' (awaiting customer acceptance)
- `released` defaults to false - provider must release estimate before customer can accept/reject
- Estimates never expire since property characteristics remain consistent

---

### Accept Estimate
**Endpoint:** `PATCH /estimates/:id/accept`  
**Auth Required:** Yes (Customer must own the property)  
**Success Response (200):**
```json
{
  "message": "Estimate accepted successfully",
  "estimate": {
    "id": 123,
    "property_id": "uuid",
    "price_cents": 5000,
    "accepted": "accepted",
    "released": true,
    "released_at": "2026-01-01T13:00:00.000Z",
    "created_at": "2026-01-01T12:00:00.000Z"
  }
}
```
**Errors:**
- `400` - Estimate already accepted/rejected OR estimate not released by provider yet
- `401` - Unauthorized (not property owner)
- `404` - Estimate not found
- `500` - Database error

**Notes:**
- Customer must own the property via user_properties association
- Estimate must be in 'pending' state
- Estimate must have `released = true` (set by provider)
- Once accepted, customer can create a subscription

---

### Reject Estimate
**Endpoint:** `PATCH /estimates/:id/reject`  
**Auth Required:** Yes (Customer must own the property)  
**Success Response (200):**
```json
{
  "message": "Estimate rejected successfully",
  "estimate": {
    "id": 123,
    "property_id": "uuid",
    "price_cents": 5000,
    "accepted": "rejected",
    "released": true,
    "released_at": "2026-01-01T13:00:00.000Z",
    "created_at": "2026-01-01T12:00:00.000Z"
  }
}
```
**Errors:**
- `400` - Estimate already accepted/rejected OR estimate not released by provider yet
- `401` - Unauthorized (not property owner)
- `404` - Estimate not found
- `500` - Database error

**Notes:**
- Customer must own the property via user_properties association
- Estimate must be in 'pending' state
- Estimate must have `released = true` (set by provider)

---

## Stripe/Payments

### Create Stripe Customer
**Endpoint:** `POST /stripe/create-customer`  
**Auth Required:** Yes  
**Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```
**Success Response (200):**
```json
{
  "customer": {
    "stripeId": "cus_xxxxx",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```
**Errors:**
- `401` - Unauthorized
- `500` - Stripe customer creation failed or database update failed

**Notes:**
- Creates Stripe customer and stores stripe_id in users table
- If database update fails, automatically deletes the Stripe customer (rollback)
- Should be called before checkout when user is committed to paying

---

### Create Checkout Session
**Endpoint:** `POST /stripe/create-checkout-session`  
**Auth Required:** Yes  
**Body:**
```json
{
  "propertyId": "uuid",
  "bookingId": "uuid"
}
```
**Success Response (200):**
```json
{
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_xxxxx"
}
```
**Errors:**
- `400` - Missing propertyId or bookingId
- `401` - Unauthorized
- `500` - Stripe session creation failed

**Notes:**
- Creates Stripe Checkout session for payment
- Includes bookingId in metadata for webhook processing
- Redirects to success/cancel URLs after payment

---

### Create Subscription
**Endpoint:** `POST /stripe/create-subscription`  
**Auth Required:** Yes  
**Body:**
```json
{
  "estimateId": 123,
  "frequency": "weekly"
}
```
**Success Response (200):**
```json
{
  "subscriptionId": 456,
  "sessionId": "cs_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_xxxxx"
}
```
**Errors:**
- `400` - Missing fields, invalid frequency, estimate not accepted, or active subscription exists
- `401` - Unauthorized
- `403` - Not property owner
- `404` - Estimate or completed booking not found
- `500` - Stripe or database error

**Notes:**
- Estimate must be accepted before subscribing
- Frequency must be 'weekly' or 'biweekly'
- Requires at least one completed booking for the property
- Next service date calculated as 7 or 14 days after last completed service (same day of week)
- Returns Stripe Checkout URL (same flow as first-time booking)
- Creates pending subscription in DB (activated via webhook after payment)
- Creates 2-4 weeks of bookings in rolling window (weekly: 2 bookings, biweekly: 1 booking)
- One subscription allowed per property (supports multiple properties per customer)

---

### Stripe Webhook
**Endpoint:** `POST /webhook`  
**Auth Required:** No (validated via Stripe signature)  
**Description:** Handles Stripe events (checkout.session.completed, payment_intent.succeeded, etc.)

**Events Handled:**
- `checkout.session.completed` - Updates booking payment_status to 'paid' for one-time bookings, OR activates subscription and creates initial bookings for subscriptions (checks session.mode)
- `customer.subscription.created` - Logs event (subscription activation handled by checkout.session.completed)
- `invoice.payment_succeeded` - Marks next booking as paid, creates next booking in rolling window
- `customer.subscription.deleted` - Cancels subscription, removes future unpaid bookings
- `invoice.payment_failed` - Logs failure (TODO: implement retry/dunning strategy)
- Logs all events to events table for debugging

---

## Subscriptions

### Get All Subscriptions
**Endpoint:** `GET /subscriptions`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "subscriptions": [
    {
      "id": 456,
      "created_at": "2026-01-01T12:00:00.000Z",
      "start_date": "2026-01-01T12:00:00.000Z",
      "canceled_at": null,
      "frequency": "weekly",
      "status": "active",
      "next_service_date": "2026-01-13T10:00:00.000Z",
      "stripe_subscription_id": "sub_xxxxx",
      "properties": {
        "id": "uuid",
        "address": "123 Main St",
        "city": "Dallas",
        "state": "Texas",
        "postal": "75001"
      },
      "estimates": {
        "id": 123,
        "price_cents": 5000
      }
    }
  ]
}
```
**Errors:**
- `401` - Unauthorized
- `500` - Database error

---

### Get Subscription by ID
**Endpoint:** `GET /subscriptions/:id`  
**Auth Required:** Yes  
**Success Response (200):**
```json
{
  "subscription": {
    "id": 456,
    "frequency": "weekly",
    "status": "active",
    "next_service_date": "2026-01-13T10:00:00.000Z",
    "properties": { ... },
    "estimates": { ... }
  },
  "upcomingBookings": [
    {
      "id": "uuid",
      "date_of_service": "2026-01-13T10:00:00.000Z",
      "service_status": "scheduled",
      "payment_status": "pending"
    }
  ]
}
```
**Errors:**
- `401` - Unauthorized
- `404` - Subscription not found
- `500` - Database error

---

### Cancel Subscription
**Endpoint:** `PATCH /subscriptions/:id/cancel`  
**Auth Required:** Yes (Customer must own subscription)  
**Success Response (200):**
```json
{
  "message": "Subscription canceled successfully",
  "subscription": {
    "id": 456,
    "status": "canceled",
    "canceled_at": "2026-01-01T14:00:00.000Z"
  }
}
```
**Errors:**
- `400` - Subscription already canceled
- `401` - Unauthorized
- `404` - Subscription not found
- `500` - Database or Stripe error

**Notes:**
- Cancels Stripe subscription immediately
- Removes all future unpaid bookings
- Paid bookings remain and will be serviced

---

### Update Subscription Frequency
**Endpoint:** `PATCH /subscriptions/:id/update-frequency`  
**Auth Required:** Yes (Customer must own subscription)  
**Body:**
```json
{
  "frequency": "biweekly"
}
```
**Success Response (200):**
```json
{
  "message": "Subscription frequency updated successfully",
  "subscription": {
    "id": 456,
    "frequency": "biweekly",
    "status": "active"
  }
}
```
**Errors:**
- `400` - Invalid frequency, subscription not active, or already at desired frequency
- `401` - Unauthorized
- `404` - Subscription not found
- `500` - Database or Stripe error

**Notes:**
- Only works for active subscriptions
- Updates Stripe subscription interval (weekly = 1 week, biweekly = 2 weeks)
- Does not prorate billing
- Existing bookings remain, new bookings use new frequency

---

## Error Handling

### Error Response Format
All errors follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400) - Missing or invalid request data
- `CANCELLATION_TOO_LATE` (400) - Attempted to cancel booking on day of service
- `AUTHENTICATION_ERROR` (401) - Missing, invalid, or expired token
- `NOT_FOUND_ERROR` (404) - Resource not found
- `DATABASE_ERROR` (500) - Database query failed
- `UNKNOWN_ERROR` (500) - Unexpected server error

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Schema Notes

### Key Tables
- **users** - User accounts (id is UUID from Supabase Auth)
- **properties** - Property details
- **user_properties** - Join table linking users to properties (supports soft deletes via deleted_at)
- **bookings** - Service bookings
- **estimates** - Price estimates for properties
- **subscriptions** - Recurring service subscriptions
- **messages** - Customer messages/notes for properties

### RLS Policies
Row-Level Security is enabled on all tables. Users can only access:
- Their own user data
- Properties they own (via user_properties)
- Bookings where they are the customer or assigned provider
- Their own subscriptions and estimates

---

## Authentication Flow

### New Users (Recommended)
1. Frontend uses Supabase Auth (Google OAuth, email/password)
2. Supabase returns JWT
3. Backend validates JWT via `supabase.auth.getUser(token)`
4. User record created automatically via `handle_new_user()` trigger

### Legacy Users (Custom Auth)
1. Frontend calls `POST /login`
2. Backend returns custom JWT
3. **Note:** This is being phased out in favor of Supabase Auth

---

## Error Handling

### Authentication Errors

**401 Unauthorized - No Token Provided:**
```json
{
  "message": "No token provided"
}
```
Cause: Request missing both cookie `sb-access-token` and `Authorization` header.

**401 Unauthorized - Invalid Token:**
```json
{
  "message": "Invalid token"
}
```
Cause: JWT verification failed (wrong secret, tampered token, or invalid signature).

**401 Unauthorized - Token Expired:**
```json
{
  "message": "Token expired"
}
```
Cause: JWT has expired. User needs to refresh their session via Supabase Auth.

**500 Internal Server Error - Server Config:**
```json
{
  "message": "Server configuration error"
}
```
Cause: Missing `SUPABASE_JWT_SECRET` in environment variables.

### Common Error Responses

**400 Bad Request:**
```json
{
  "message": "Missing required fields",
  "details": "..."
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Database error",
  "error": "..."
}
```

---

## Rate Limiting
- **Limit:** 100 requests per minute per IP
- **Response when exceeded:** `429 Too Many Requests`

---

## CORS
**Allowed Origins:**
- Development: `http://localhost:5173`
- Production: `https://www.mowzaic.com`

---

## Notes for Mobile App Development

1. **Authentication:** 
   - Use Supabase Auth for login/signup (Google OAuth, Email/Password)
   - Supabase automatically manages JWT tokens in HTTP-only cookies
   - For mobile apps, include token in `Authorization: Bearer <token>` header
   - Backend accepts both cookies and Authorization headers

2. **Token Management:**
   - Handle `401` errors by refreshing token via Supabase or redirecting to login
   - Token expiration is handled by Supabase's session management
   
3. **Always include Authorization header** for protected endpoints

4. **Provider vs Customer roles** - Some endpoints are provider-only (not yet enforced via middleware, but should be in UI)

5. **Soft deletes** - Properties use `deleted_at` for analytics; always filter by `deleted_at IS NULL` for active properties

6. **First-time pricing** - Always $35 for first service, then provider can set custom estimate

7. **Booking flow:**
   - **First-time service:** Customer books → creates pending booking ($35 guaranteed) → pays → provider completes
   - **Recurring service:** Provider creates estimate → customer accepts → customer subscribes (weekly/biweekly) → system auto-creates bookings in 2-week rolling window
   - **Subscription lifecycle:** Active subscription → invoice.payment_succeeded marks booking paid → creates next booking to maintain window → on cancel, removes future unpaid bookings
8. **Subscription rules:**
   - One subscription per property (customers can have multiple properties)
   - Requires completed first service before subscribing

---

## JWT Token Details

**Token Location Priority:**
1. Cookie: `sb-access-token` (HTTP-only, set by frontend)
2. Header: `Authorization: Bearer <token>`

**JWT Payload Structure:**
```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "role": "authenticated",
  "user_metadata": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "aud": "authenticated",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Backend Extracts:**
- `req.user.id` from `payload.sub`
- `req.user.email` from `payload.email`
- `req.user.role` from `payload.role`
   - Next service date aligns to same day of week (e.g., every Monday)
   - Weekly creates 2 bookings ahead, biweekly creates 1 booking ahead (maintains 2-week visibility)
   - Bookings created even if outside customer-facing 2-week booking window

---

## Changelog
- **2026-01-01**: Implemented subscription workflow (Step 2)
  - Added `stripe_subscription_id`, `next_service_date` to subscriptions table
  - Added `payment_intent_id` to bookings table
  - Created `/estimates/:id/accept` and `/estimates/:id/reject` endpoints
  - Created `/stripe/create-subscription` endpoint
  - Created subscription management endpoints (`GET`, `PATCH /cancel`, `PATCH /update-frequency`)
  - Added webhook handlers for subscription lifecycle events
  - Implemented rolling window booking creation (2-week lookahead)
- **2025-12-26**: Migrated to Supabase Auth (UUIDs for user IDs)
- **2025-12-26**: Removed providers table, consolidated into users table
- **2025-12-26**: Added soft delete support for user_properties
- **2025-12-26**: Removed default provider_id from bookings
- **2025-12-26**: Added RPC functions for booking flow

---

**Last Updated:** January 1, 2026
