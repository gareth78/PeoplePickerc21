export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { refreshJWT, extractJWT } from '@/lib/auth/jwt';
import { createAuditLog } from '@/lib/admin/audit';

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 * Validates current token and issues a new one if valid
 */
export async function POST(request: NextRequest) {
  try {
    // Extract current JWT from header or cookie
    const token = extractJWT(
      request.headers,
      request.headers.get('cookie') || undefined
    );

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Refresh the token
    try {
      const newToken = await refreshJWT(token);

      // Get user info from the old token for audit log
      // (We know it's valid because refreshJWT succeeded)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );

        await createAuditLog({
          action: 'AUTH_TOKEN_REFRESH',
          adminEmail: payload.email,
          metadata: {
            success: true,
          },
        });
      }

      // Return new token
      // For web client, also set cookie
      const response = NextResponse.json({
        jwt: newToken,
      });

      // Set cookie if request came from web client (has cookie)
      if (request.headers.get('cookie')?.includes('jwt=')) {
        response.cookies.set('jwt', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 4 * 60 * 60, // 4 hours
          path: '/',
        });
      }

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);

      // Try to get email for audit log
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          );

          await createAuditLog({
            action: 'AUTH_FAILED',
            adminEmail: payload.email || 'anonymous',
            metadata: {
              reason: 'Token refresh failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      } catch (auditError) {
        // Ignore audit log errors
      }

      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Refresh endpoint error:', error);

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
