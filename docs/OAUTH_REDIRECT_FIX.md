# OAuth Redirect URI Fix

## Problem

The application was encountering the following Azure AD error during sign-on:

```
AADSTS50011: The redirect URI 'https://localhost:3000/api/auth/oauth/callback' 
specified in the request does not match the redirect URIs configured for the 
application '806a3632-99d4-4ee4-8658-994d2056c3a3'.
```

### Root Cause

The OAuth routes were dynamically constructing the redirect URI based on the incoming HTTP request's origin:

```typescript
// OLD CODE - PROBLEMATIC
const baseUrl = new URL(request.url).origin;
const redirectUri = `${baseUrl}/api/auth/oauth/callback`;
```

This approach had several issues:

1. **Request Origin Dependency**: The redirect URI was derived from `request.url`, which could vary based on:
   - Proxy configurations
   - Load balancers
   - Development vs. production environments
   - Browser referrer headers

2. **No Explicit Configuration**: There was no way to explicitly set the production URL, making the OAuth flow unreliable in deployed environments.

3. **Localhost Leakage**: Even in production, if the request somehow contained a localhost origin (through proxying or forwarding), the redirect URI would be constructed as `https://localhost:3000/...`, causing Azure AD to reject it.

## Solution

### Code Changes

Updated both OAuth route handlers to use an explicit base URL from environment variables:

**File: `apps/web/app/api/auth/oauth/route.ts`**
```typescript
// NEW CODE - FIXED
const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
const redirectUri = `${baseUrl}/api/auth/oauth/callback`;
```

**File: `apps/web/app/api/auth/oauth/callback/route.ts`**
```typescript
// NEW CODE - FIXED
const origin = process.env.APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
const redirectUri = `${origin}/api/auth/oauth/callback`;
```

### Environment Variable Priority

The code now uses this priority order:
1. `APP_URL` - Primary environment variable for the application base URL
2. `NEXTAUTH_URL` - Standard Next.js auth library convention (for compatibility)
3. `new URL(request.url).origin` - Fallback to request origin (for local development)

### Updated Environment Configuration

Added the `APP_URL` variable to `.env.local.example`:

```bash
# Application Base URL (CRITICAL for OAuth redirects)
# This MUST be set to your production URL in production environments
# It should match the redirect URI registered in Azure AD
# Examples: 
#   - Production: https://yourdomain.com
#   - Development: http://localhost:3000
APP_URL=http://localhost:3000
```

## Deployment Steps

### For Production Deployment

1. **Set the `APP_URL` environment variable** in your hosting environment:
   ```bash
   APP_URL=https://your-production-domain.com
   ```

2. **Verify Azure AD App Registration**:
   - Go to Azure Portal → Azure Active Directory → App Registrations
   - Find your application (ID: `806a3632-99d4-4ee4-8658-994d2056c3a3`)
   - Navigate to "Authentication" → "Redirect URIs"
   - Ensure the following URI is registered:
     ```
     https://your-production-domain.com/api/auth/oauth/callback
     ```

3. **Remove localhost URIs from Azure AD** (if present in production app):
   - Remove any `http://localhost:3000/*` entries
   - Remove any `https://localhost:3000/*` entries

### For Development

1. **Set the `APP_URL` in your local `.env.local` file**:
   ```bash
   APP_URL=http://localhost:3000
   ```

2. **Ensure Azure AD has the development redirect URI** (for development app registration):
   ```
   http://localhost:3000/api/auth/oauth/callback
   ```

### For Azure Static Web Apps

If deploying to Azure Static Web Apps, set the environment variable in the configuration:

1. Go to Azure Portal → Your Static Web App
2. Navigate to "Configuration"
3. Add application setting:
   - **Name**: `APP_URL`
   - **Value**: `https://your-static-web-app-url.azurestaticapps.net`

### For Docker Deployments

Add the environment variable to your `docker-compose.yml` or Docker run command:

```yaml
# docker-compose.yml
services:
  web:
    environment:
      - APP_URL=https://your-production-domain.com
```

Or:

```bash
docker run -e APP_URL=https://your-production-domain.com ...
```

## Testing

### Verify the Fix

1. **Check Environment Variable**:
   ```bash
   # In your server environment
   echo $APP_URL
   ```

2. **Test OAuth Flow**:
   - Navigate to your application
   - Click "Sign in with Microsoft"
   - Monitor the redirect URI in the Azure AD authorization URL
   - Verify it matches your configured Azure AD redirect URI

3. **Check Server Logs**:
   - Look for any OAuth-related errors in your application logs
   - Verify that the redirect URI being sent matches your `APP_URL`

### Debug Mode

To see what redirect URI is being constructed, you can temporarily add logging:

```typescript
console.log('[OAUTH] Base URL:', baseUrl);
console.log('[OAUTH] Redirect URI:', redirectUri);
```

## Common Issues

### Issue: Still seeing localhost in redirect URI

**Solution**: 
- Verify `APP_URL` is set in your production environment
- Restart your application after setting the environment variable
- Clear any cached environment variables in your hosting platform

### Issue: Azure AD redirect URI mismatch

**Solution**:
- Ensure the `APP_URL` value EXACTLY matches what's registered in Azure AD
- Check for trailing slashes (the URL should NOT have a trailing slash)
- Verify the protocol (http vs https)

### Issue: Different environments need different URIs

**Solution**:
- Use separate Azure AD app registrations for dev/staging/production
- Configure different `APP_URL` values for each environment
- Register the appropriate redirect URIs in each Azure AD app registration

## Related Files

- `/apps/web/app/api/auth/oauth/route.ts` - OAuth initiation endpoint
- `/apps/web/app/api/auth/oauth/callback/route.ts` - OAuth callback handler
- `/apps/web/lib/auth/microsoft.ts` - Microsoft authentication utilities
- `/.env.local.example` - Environment variable template

## Additional Notes

### Why Not Use Request Origin?

While using the request origin seems convenient, it's unreliable because:

1. **Proxy/Load Balancer Issues**: If your app is behind a proxy, the request URL might reflect the proxy's address, not your public domain
2. **Security**: Allows potential manipulation of the redirect URI through request headers
3. **Consistency**: Different requests might have different origins (especially in complex networking setups)

### Alternative: Use X-Forwarded-Host Header

If you cannot use an environment variable, you could use the `X-Forwarded-Host` header:

```typescript
const forwardedHost = request.headers.get('x-forwarded-host');
const protocol = request.headers.get('x-forwarded-proto') || 'https';
const baseUrl = forwardedHost ? `${protocol}://${forwardedHost}` : new URL(request.url).origin;
```

However, this still relies on correct proxy configuration and is less explicit than using an environment variable.

## Conclusion

This fix ensures that the OAuth redirect URI is explicitly configured and consistent across all environments, eliminating the "redirect URI mismatch" error. The key is to **always set `APP_URL` in production environments** to match your Azure AD app registration.
