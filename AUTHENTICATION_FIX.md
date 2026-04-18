# Authentication Fix: Complete Setup & Testing Guide

## What Was Fixed

This document outlines the authentication issues that were resolved and how to verify the fixes work correctly.

### Issues Resolved

1. **JWT_SECRET Not Configured** ✅
   - Backend was using default secret, causing validation failures
   - Solution: Added JWT_SECRET to backend .env file

2. **Better 401 Error Handling** ✅
   - Frontend now automatically clears invalid tokens and redirects to login
   - Prevents repeated failed API calls with expired tokens

3. **Token Verification on Page Load** ✅
   - ProtectedRoute now verifies token validity before allowing access
   - Invalid tokens trigger automatic logout and redirect to login

4. **Improved Debugging** ✅
   - Added console logging to help diagnose authentication issues
   - Backend logs when JWT_SECRET is not configured

## Setup Instructions

### Backend Setup (Required)

1. Navigate to the backend directory:
```bash
cd StudentsResearchLab/backend
```

2. Ensure `.env` file has JWT_SECRET configured:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="admin-secret-key-change-in-production-2024"
```

3. Restart the backend server:
```bash
npm start
# or for development
npm run dev
```

4. Verify startup logs show JWT configuration:
```
✅ JWT_SECRET: Configured
```

### Frontend Setup (Optional but Recommended)

1. Navigate to frontend directory:
```bash
cd students-research-lab-admin-portal
```

2. Verify `.env` has backend URL:
```
VITE_BACKEND_URL=https://studentsresearchlab-coge.onrender.com/api
```

For local development, change to:
```
VITE_BACKEND_URL=http://localhost:8000/api
```

3. Clear localStorage and browser cache (optional):
   - Open DevTools (F12)
   - Go to Application > Storage > Local Storage
   - Clear all data or just the admin-related tokens

## Testing the Authentication Flow

### Test 1: Login Process

1. Open the admin portal in a new browser window/incognito tab
2. Navigate to `/login`
3. Enter admin credentials (from the authorization table in your database)
4. Click "Login"

**Expected Results:**
- ✅ Login page shows "Login successful" toast
- ✅ Page redirects to dashboard
- ✅ Console shows: "Saving auth token to localStorage"
- ✅ Console shows: "Token saved successfully"

**If it fails:**
- ❌ Check backend logs for login errors
- ❌ Verify JWT_SECRET is set in backend .env
- ❌ Verify admin credentials are correct in the database

### Test 2: API Calls with Token

1. After successful login, navigate to any dashboard page
2. Open browser DevTools (F12) > Console
3. Check for API calls being made

**Expected Results:**
- ✅ No 401 errors in console
- ✅ Console shows: "[API] GET /admin/students (with token)"
- ✅ Console shows: "[API Success] GET /admin/students"
- ✅ Dashboard data loads correctly

**If it fails:**
- ❌ Check console for: "[API Error] ... - Status: 401"
- ❌ Verify token is in localStorage: `localStorage.getItem("adminToken")`
- ❌ Check if token includes "Bearer" prefix is being added

### Test 3: Token Validation

1. After login, open DevTools > Application > Storage > Local Storage
2. Find the entry with key "adminToken"
3. Copy the token value and decode it at https://jwt.io
4. Verify the token contains: `"isAdmin": true`

**Expected Results:**
- ✅ Token payload shows: `{ email, name, enrollmentNo, isAdmin: true }`
- ✅ Token has: `"exp"` field (expiration timestamp)
- ✅ Expiration is approximately 24 hours from login

### Test 4: Expired Token Handling

1. After login, manually edit the token in localStorage to an invalid value
2. Refresh the page
3. Try to access any protected page

**Expected Results:**
- ✅ ProtectedRoute detects invalid token
- ✅ Page redirects to login page automatically
- ✅ Console shows: "Token verification failed"

### Test 5: Token Expiration Simulation

1. Note the token expiration time from Test 3
2. Wait until token naturally expires OR manually edit the token
3. Try to make an API request

**Expected Results:**
- ✅ Request returns 401 Unauthorized
- ✅ Frontend console shows: "Unauthorized (401) - clearing token and redirecting to login"
- ✅ User is redirected to login page
- ✅ localStorage is cleared of invalid token

## Debugging Tips

### Check Backend JWT Configuration
```bash
# In backend directory
grep JWT_SECRET .env
# Should output: JWT_SECRET="admin-secret-key-change-in-production-2024"
```

### Check Token in Browser
```javascript
// In browser DevTools Console
localStorage.getItem("adminToken")
// Should output: "eyJhbGciOiJIUzI1NiIs..." (long JWT string)
```

### Decode Token
```javascript
// In browser DevTools Console
const token = localStorage.getItem("adminToken");
const parts = token.split('.');
const decoded = JSON.parse(atob(parts[1]));
console.log(decoded);
// Should show: { email, name, enrollmentNo, isAdmin: true, exp, iat }
```

### Check Backend Logs
```bash
# Should show when server starts:
✅ Server is running on port 8000
✅ JWT_SECRET: Configured
```

### Monitor API Requests
1. Open DevTools > Network tab
2. Make an API request
3. Check the request headers for: `Authorization: Bearer <token>`
4. Check response status and body

## Troubleshooting Matrix

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| 401 errors on all API calls | JWT_SECRET not set | Set JWT_SECRET in backend .env |
| Token works initially then fails | Token expired | User must log in again |
| No token in localStorage after login | Login API not returning token | Check backend login endpoint response |
| CORS errors on login | Wrong backend URL | Verify VITE_BACKEND_URL matches backend URL |
| Login works but redirects back to login | Token verification failing | Check if JWT_SECRET matches between generation and validation |
| Localhost backend not working | Backend not running | Start backend with `npm run dev` |

## Production Deployment Checklist

Before deploying to production (Render, Vercel, etc.):

- [ ] Generate a strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set JWT_SECRET environment variable on hosting platform
- [ ] Set VITE_BACKEND_URL to production backend URL on frontend hosting
- [ ] Test login with production credentials
- [ ] Monitor production logs for JWT configuration warnings
- [ ] Keep the generated JWT_SECRET in a secure location (password manager)

## References

- [JWT.io - JWT Documentation](https://jwt.io)
- [Express Middleware Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Authentication Patterns](https://react.dev/reference/react/useEffect)

## Support

If you continue to experience authentication issues:

1. Check the console logs (frontend and backend)
2. Verify JWT_SECRET is set on all server instances
3. Ensure token hasn't expired (24 hour limit)
4. Clear localStorage and cache before testing
5. Try logging in with a fresh browser incognito window
