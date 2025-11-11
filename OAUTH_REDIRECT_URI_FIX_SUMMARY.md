# OAuth Redirect URI Fix - Summary

## Problem Identified

The error `AADSTS50011: The redirect URI 'https://localhost:3000/api/auth/oauth/callback'` was occurring because the OAuth routes were dynamically constructing the redirect URI from the incoming HTTP request's origin instead of using an explicitly configured production URL.

## Root Cause

**Files Affected:**
- `apps/web/app/api/auth/oauth/route.ts` (line 14-15)
- `apps/web/app/api/auth/oauth/callback/route.ts` (line 55-56)

**Problematic Code:**
```typescript
const baseUrl = new URL(request.url).origin;
const redirectUri = `${baseUrl}/api/auth/oauth/callback`;
```

This approach meant the redirect URI could vary based on:
- Proxy/load balancer configurations
- Request headers
- Browser referrer information
- Environment inconsistencies

Even in production, if a request somehow contained localhost in its origin (through forwarding, proxying, or CORS), the redirect URI would be constructed as `https://localhost:3000/api/auth/oauth/callback`, causing Azure AD to reject it.

## Solution Applied

### 1. Updated OAuth Initiation Route (`apps/web/app/api/auth/oauth/route.ts`)

Changed line 14-15 to:
```typescript
// Use explicit APP_URL if set (for production), otherwise derive from request
const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
const redirectUri = `${baseUrl}/api/auth/oauth/callback`;
```

### 2. Updated OAuth Callback Route (`apps/web/app/api/auth/oauth/callback/route.ts`)

Changed line 54-56 to:
```typescript
// Get redirect URI (must match the one used in the authorization request)
// Use explicit APP_URL if set (for production), otherwise derive from request
const origin = process.env.APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
const redirectUri = `${origin}/api/auth/oauth/callback`;
```

### 3. Updated Environment Configuration (`.env.local.example`)

Added the `APP_URL` environment variable with documentation:
```bash
# Application Base URL (CRITICAL for OAuth redirects)
# This MUST be set to your production URL in production environments
# It should match the redirect URI registered in Azure AD
# Examples: 
#   - Production: https://yourdomain.com
#   - Development: http://localhost:3000
APP_URL=http://localhost:3000
```

## Required Deployment Actions

### IMMEDIATE ACTION REQUIRED for Production:

1. **Set the `APP_URL` environment variable in your production environment:**
   ```bash
   APP_URL=https://your-production-domain.com
   ```

2. **Verify Azure AD App Registration:**
   - Ensure the redirect URI `https://your-production-domain.com/api/auth/oauth/callback` is registered in Azure AD
   - Application ID: `806a3632-99d4-4ee4-8658-994d2056c3a3`

3. **Restart the application** after setting the environment variable

### For Development:

No action required - the code will fall back to the request origin in development environments where `APP_URL` is not set.

## Environment Variable Priority

The code now checks in this order:
1. `APP_URL` (new, primary)
2. `NEXTAUTH_URL` (Next.js auth convention, for compatibility)
3. `request.url.origin` (fallback for development)

## Why This Happened

The localhost reference was never hardcoded in the code - it was being dynamically extracted from incoming HTTP requests. In production environments with reverse proxies, load balancers, or CORS configurations, the request URL could inadvertently contain localhost as the origin.

## Testing the Fix

After deployment with `APP_URL` set:

1. Monitor application logs for OAuth flows
2. Verify the redirect URI in Azure AD authorization requests
3. Confirm successful authentication without redirect URI errors

## Documentation

Complete documentation has been created at: `/workspace/docs/OAUTH_REDIRECT_FIX.md`

This includes:
- Detailed problem explanation
- Solution implementation
- Deployment steps for various platforms
- Troubleshooting guide
- Common issues and solutions

## Files Modified

1. `/workspace/apps/web/app/api/auth/oauth/route.ts`
2. `/workspace/apps/web/app/api/auth/oauth/callback/route.ts`
3. `/workspace/.env.local.example`
4. `/workspace/docs/OAUTH_REDIRECT_FIX.md` (new)
