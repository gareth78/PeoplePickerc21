import { NextRequest } from 'next/server';

/**
 * Get the base URL for the application
 * Priority:
 * 1. Environment variable (BASE_URL or NEXT_PUBLIC_BASE_URL)
 * 2. X-Forwarded-Host + X-Forwarded-Proto headers (for proxies/load balancers)
 * 3. Host header + protocol from request
 * 4. Fallback to request.url origin
 * 
 * @param request - Next.js request object
 * @returns Base URL (e.g., https://example.com)
 */
export function getBaseUrl(request: NextRequest): string {
  // 1. Check environment variables first
  const envBaseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (envBaseUrl) {
    // Remove trailing slash if present
    return envBaseUrl.replace(/\/$/, '');
  }

  // 2. Check forwarded headers (for proxies/load balancers)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    // X-Forwarded-Host can contain multiple hosts, take the first one
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`;
  }

  // 3. Check Host header
  const host = request.headers.get('host');
  if (host) {
    // Determine protocol from forwarded header or request URL
    let protocol = request.headers.get('x-forwarded-proto');
    if (!protocol) {
      try {
        const url = new URL(request.url);
        protocol = url.protocol.replace(':', '');
      } catch {
        protocol = 'https'; // Default to https in production
      }
    }
    return `${protocol}://${host}`;
  }

  // 4. Fallback to request.url origin
  try {
    return new URL(request.url).origin;
  } catch {
    // Last resort: log warning and return a safe default
    console.warn('[AUTH] Could not determine base URL from request, using fallback');
    // In production, this should never happen if BASE_URL is set
    return process.env.NODE_ENV === 'production' 
      ? 'https://localhost:3000' // This will fail, but at least it's explicit
      : 'http://localhost:3000';
  }
}
