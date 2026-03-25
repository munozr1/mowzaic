# Quick Setup Guide - Supabase JWT Integration

## ⚡ Quick Start (3 Steps)

### 1. Get Your JWT Secret
```
Supabase Dashboard → Settings → API → JWT Settings → Copy "JWT Secret"
```

### 2. Add to Environment Files

**`.env.development`:**
```env
SUPABASE_JWT_SECRET=your-actual-jwt-secret-from-step-1
```

**`.env` (production):**
```env
SUPABASE_JWT_SECRET=your-actual-jwt-secret-from-step-1
```

### 3. Restart Backend
```bash
bun run dev
```

## ✅ Test It Works

### Test authenticated endpoint:
```bash
# From your frontend (logged in), check browser DevTools → Network → Request Headers
# Copy the cookie value for 'sb-access-token'

curl http://localhost:3000/subscriptions \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE"
```

### Expected: ✅ 200 OK with data
### Before Fix: ❌ 401 "signing method ES256 is invalid"

## 🔧 What Changed

| File | Change |
|------|--------|
| `middleware.js` | Now reads token from cookies + Authorization header |
| `middleware.js` | Uses `jose` library to verify JWT with SUPABASE_JWT_SECRET |
| `auth.js` | Marked custom JWT routes as DEPRECATED |
| `.env files` | Added `SUPABASE_JWT_SECRET` placeholder |
| `package.json` | Added `jose` dependency |

## 📝 Token Location Priority

1. **Cookie** `sb-access-token` (used by frontend) ← **Primary**
2. **Header** `Authorization: Bearer <token>` ← Fallback

## 🐛 Troubleshooting

### Error: "Server configuration error"
→ Add `SUPABASE_JWT_SECRET` to your `.env` file

### Error: "Invalid token signature"
→ Wrong JWT secret. Double-check you copied the correct one from Supabase

### Error: "Token expired"
→ User needs to log in again (token TTL expired)

### Still getting 401?
→ Check if cookie `sb-access-token` is being sent (DevTools → Network → Cookies)

## 🔒 Security Notes

- ✅ JWT Secret verifies tokens (never expose to frontend)
- ✅ Tokens in HTTP-only cookies (XSS protection)
- ✅ Service role key separate from JWT verification
- ⚠️ Old custom JWT routes still work but are deprecated

## 📦 Production Deploy

1. Add `SUPABASE_JWT_SECRET` to production environment variables
2. Deploy updated code
3. Restart server
4. Test with production frontend

---

**Need Help?** Check `SUPABASE_JWT_MIGRATION.md` for detailed implementation notes.
