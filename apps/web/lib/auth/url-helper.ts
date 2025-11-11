import { NextRequest } from 'next/server';

/**
 * Get the public base URL for the application
 * 
 * This function handles cases where the app is behind a proxy/load balancer
 * and request.url might contain internal hostnames or localhost.
 * 
 * Priority:
 * 1. PUBLIC_URL or NEXT_PUBLIC_BASE_URL environment variable
 * 2. X-Forwarded-Host + X-Forwarded-Proto headers (from proxy/load balancer)
 * 3. request.url (fallback)
 * 
 * @param request - Next.js request object
 * @returns The public base URL (e.g., https://example.com)
 */
export function getPublicBaseUrl(request: NextRequest): string {
  // 1. Check for explicit environment variable
  const publicUrl = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (publicUrl) {
    try {
      const url = new URL(publicUrl);
      return url.origin;
    } catch {
      // Invalid URL, continue to next option
    }
  }

  // 2. Check for forwarded headers (from proxy/load balancer)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    // Remove port if present (we'll use standard ports based on protocol)
    const host = forwardedHost.split(':')[0];
    const protocol = forwardedProto === 'http' ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  // 3. Fallback to request.url
  try {
    return new URL(request.url).origin;
  } catch {
    // Last resort: return a default (shouldn't happen)
    throw new Error('Unable to determine public base URL');
  }
}
