export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exchangeOAuthCode } from '@/lib/auth/microsoft';
import { generateJWT } from '@/lib/auth/jwt';
import { searchUserByEmail } from '@/lib/okta';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

/**
 * GET /api/auth/oauth/callback
 * OAuth callback handler
 * Receives authorization code from Microsoft and exchanges it for our JWT
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);

      // Redirect to login page with error
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate code
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code required' },
        { status: 400 }
      );
    }

    // Parse state to get return URL
    let returnTo = '/';
    if (state) {
      try {
        const decoded = JSON.parse(
          Buffer.from(state, 'base64').toString('utf-8')
        );
        returnTo = decoded.returnTo || '/';
      } catch (error) {
        console.error('Failed to parse state:', error);
      }
    }

    // Get redirect URI (must match the one used in the authorization request)
    // Use explicit APP_URL if set (for production), otherwise derive from request
    const origin = process.env.APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/oauth/callback`;

    // Exchange code for tokens
    let email: string;
    try {
      const tokenData = await exchangeOAuthCode(code, redirectUri);
      email = tokenData.email;
    } catch (error) {
      console.error('OAuth code exchange failed:', error);

      await createAuditLog({
        action: 'AUTH_FAILED',
        adminEmail: 'anonymous',
        metadata: {
          reason: 'OAuth code exchange failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.redirect(
        new URL('/?error=auth_failed', request.url)
      );
    }

    // Check if user exists in Okta directory
    try {
      const oktaUser = await searchUserByEmail(email);

      if (!oktaUser) {
        console.error('User not found in Okta directory:', email);

        await createAuditLog({
          action: 'AUTH_FAILED',
          adminEmail: email,
          metadata: {
            reason: 'User not found in Okta directory',
          },
        });

        return NextResponse.redirect(
          new URL('/?error=user_not_found', request.url)
        );
      }
    } catch (error) {
      console.error('Okta user lookup failed:', error);

      await createAuditLog({
        action: 'AUTH_FAILED',
        adminEmail: email,
        metadata: {
          reason: 'Okta lookup failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.redirect(
        new URL('/?error=directory_error', request.url)
      );
    }

    // Check if user is an admin
    let isAdmin = false;
    try {
      const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() },
      });
      isAdmin = !!admin;
    } catch (error) {
      console.error('Admin check failed:', error);
      // Continue with isAdmin = false
    }

    // Generate JWT
    const jwt = await generateJWT(email, isAdmin);

    // Create audit log
    await createAuditLog({
      action: 'AUTH_LOGIN',
      adminEmail: email,
      metadata: {
        method: 'oauth',
        isAdmin,
      },
    });

    // Set JWT cookie and redirect to the app
    const response = NextResponse.redirect(`${origin}${returnTo}`);

    response.cookies.set('jwt', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60, // 4 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);

    return NextResponse.redirect(
      new URL('/?error=server_error', request.url)
    );
  }
}
