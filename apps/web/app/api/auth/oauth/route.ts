import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl } from '@/lib/auth/microsoft';

/**
 * GET /api/auth/oauth
 * Initiate Microsoft OAuth flow
 * Redirects user to Microsoft login page
 */
export async function GET(request: NextRequest) {
  try {
    // Get the base URL for the redirect URI
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const redirectUri = `${baseUrl}/api/auth/oauth/callback`;

    // Get the original URL to redirect back to after authentication
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';

    // Build state parameter (for CSRF protection and return URL)
    const state = Buffer.from(
      JSON.stringify({ returnTo })
    ).toString('base64');

    // Build Microsoft OAuth URL
    const authUrl = await buildAuthUrl(redirectUri, state);

    // Redirect to Microsoft
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initiation failed:', error);

    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}
