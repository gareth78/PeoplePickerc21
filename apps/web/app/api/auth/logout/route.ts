import { NextRequest, NextResponse } from 'next/server';
import { extractJWT } from '@/lib/auth/jwt';
import { createAuditLog } from '@/lib/admin/audit';

/**
 * POST /api/auth/logout
 * Logout user and clear JWT cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Get user email from token for audit log
    const token = extractJWT(
      request.headers,
      request.headers.get('cookie') || undefined
    );

    let email = 'anonymous';
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          );
          email = payload.email || 'anonymous';
        }
      } catch (error) {
        // Ignore token parse errors
      }
    }

    // Create audit log
    await createAuditLog({
      action: 'AUTH_LOGOUT',
      adminEmail: email,
      metadata: {
        method: 'manual',
      },
    });

    // Clear JWT cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Delete cookie
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
