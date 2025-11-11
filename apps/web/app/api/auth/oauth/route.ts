export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl } from '@/lib/auth/microsoft';
import { getBaseUrl } from '@/lib/auth/utils';

/**
 * GET /api/auth/oauth
 * Initiate Microsoft OAuth flow
 * Redirects user to Microsoft login page
 */
export async function GET(request: NextRequest) {
  try {
    // Get the base URL for the redirect URI
    const baseUrl = getBaseUrl(request);
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
