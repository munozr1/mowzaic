# Supabase JWT Migration - Implementation Summary

## Overview
Updated backend to verify Supabase JWT tokens (ES256/HS256) instead of custom HS256 tokens.

## Changes Made

### 1. Updated `middleware.js` - JWT Verification
- **Old Behavior**: Used `supabase.auth.getUser()` to validate tokens from Authorization header only
- **New Behavior**: 
  - Checks for token in HTTP-only cookie `sb-access-token` (priority)
  - Falls back to `Authorization: Bearer <token>` header
  - Uses `jose` library to verify JWT with `SUPABASE_JWT_SECRET`
  - Supports both HS256 (Supabase default) and ES256 algorithms
  - Extracts user data from JWT payload (`sub`, `email`, `role`, `user_metadata`)

### 2. Installed `jose` Library
```bash
bun add jose
```
Added to `package.json` dependencies for ES256/HS256 JWT verification.

### 3. Updated Environment Variables

#### Added to `.env.example` and `.env.development`:
```env
# Supabase JWT secret (for verifying JWT tokens)
# Get from: Supabase Dashboard → Settings → API → JWT Settings → JWT Secret (standby key)
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

#### Deprecated (kept for backward compatibility):
```env
ACCESS_TOKEN_SECRET=...  # DEPRECATED
REFRESH_TOKEN_SECRET=... # DEPRECATED
```

### 4. Marked Custom Auth Routes as DEPRECATED
- Added deprecation notice to `/register`, `/login`, `/refresh`, `/logout` in `auth.js`
- These routes generate custom HS256 JWTs and should not be used
- Frontend now uses Supabase Auth via Vercel serverless functions

## Token Flow

### Frontend → Backend
1. User authenticates via Supabase Auth (frontend Vercel serverless functions)
2. Frontend stores Supabase access token in HTTP-only cookie `sb-access-token`
3. Frontend makes API requests to backend with cookie attached
4. Backend extracts token from cookie and verifies with `SUPABASE_JWT_SECRET`

### JWT Payload Structure (Supabase)
```javascript
{
  "sub": "user-uuid",           // User ID (use this for req.user.id)
  "email": "user@example.com",
  "role": "authenticated",
  "user_metadata": {
    "first_name": "John",
    "last_name": "Doe"
  },
  "exp": 1234567890,
  "iss": "https://your-project.supabase.co/auth/v1"
}
```

## Required Action

### Add SUPABASE_JWT_SECRET to Environment Files

1. **Get JWT Secret from Supabase Dashboard:**
   - Go to: Settings → API → JWT Settings
   - Copy the **JWT Secret** (standby key recommended for security)

2. **Update `.env.development`:**
   ```env
   SUPABASE_JWT_SECRET=your-actual-jwt-secret-here
   ```

3. **Update `.env` (production):**
   ```env
   SUPABASE_JWT_SECRET=your-actual-jwt-secret-here
   ```

4. **Update production server environment variables**

## Testing

### Local Development
```bash
# Add JWT secret to .env.development first
bun run dev

# Test authenticated endpoint
curl http://localhost:3000/subscriptions \
  -H "Cookie: sb-access-token=<your-supabase-token>"
```

### Expected Results
- ✅ Token verified successfully
- ✅ User ID extracted from `payload.sub`
- ✅ No "signing method ES256 is invalid" error
- ✅ Protected routes return data (not 401)

## Error Messages

### Before
```
"signing method ES256 is invalid"
```

### After (if token invalid)
```json
{
  "message": "Invalid token signature",
  "error": "invalid_signature"
}
```

### After (if token expired)
```json
{
  "message": "Token expired",
  "error": "token_expired"
}
```

## Files Modified
1. `middleware.js` - JWT verification logic
2. `auth.js` - Added deprecation notice
3. `.env.example` - Added `SUPABASE_JWT_SECRET`, marked old secrets as deprecated
4. `.env.development` - Added `SUPABASE_JWT_SECRET` placeholder
5. `package.json` - Added `jose` dependency

## Rollback Plan (if needed)
1. Revert `middleware.js` to use `supabase.auth.getUser()`
2. Remove `jose` from dependencies
3. Keep using custom JWT endpoints

## Notes
- Custom JWT auth routes still exist but are deprecated
- Frontend authentication now handled entirely by Supabase
- Backend only verifies tokens, doesn't generate them
- Tokens stored in HTTP-only cookies for security
- Service role key still used for admin operations (separate from JWT verification)
