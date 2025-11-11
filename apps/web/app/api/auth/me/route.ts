import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/auth/me
 * Get current authenticated user information
 * 
 * Query Parameters:
 * - legacy=1: Debug mode for Easy Auth (deprecated, for backward compatibility)
 * 
 * Returns user email and admin status from JWT
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const legacy = searchParams.get('legacy');

  // Legacy Easy Auth debug mode (for backward compatibility)
  // This allows debugging the transition from Easy Auth to JWT
  if (legacy === '1') {
    const principal = request.headers.get('x-ms-client-principal');
    
    if (principal) {
      try {
        const decoded = JSON.parse(
          Buffer.from(principal, 'base64').toString('utf-8')
        );
        
        return NextResponse.json({
          mode: 'easy_auth',
          claims: decoded.claims,
          userId: decoded.userId,
          identityProvider: decoded.identityProvider,
        });
      } catch (error) {
        console.error('Failed to decode Easy Auth principal:', error);
        
        return NextResponse.json({
          mode: 'easy_auth',
          error: 'Failed to decode Easy Auth principal',
        });
      }
    }
    
    return NextResponse.json({
      mode: 'easy_auth',
      error: 'No Easy Auth principal found',
    });
  }

  // JWT auth mode (default)
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized || !authResult.user) {
    return authResult.response!;
  }

  return NextResponse.json({
    mode: 'jwt',
    email: authResult.user.email,
    isAdmin: authResult.user.isAdmin,
    iat: authResult.user.iat,
    exp: authResult.user.exp,
  });
}
