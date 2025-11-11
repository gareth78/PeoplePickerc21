import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isAdmin, AdminSession } from './auth';
import { createAuditLog } from './audit';
import { getEmailFromEasyAuth, getEmailFromBearerToken } from './easyauth';
import { validateJWT, extractJWT } from '@/lib/auth/jwt';

interface AdminAuthResult {
  authenticated: boolean;
  session: Awaited<ReturnType<typeof getAdminSession>>;
  response?: NextResponse;
}

/**
 * Verify admin authentication for API routes
 * Returns authentication status and optionally a response to return
 *
 * Auth priority:
 * 1. JWT token (new auth system)
 * 2. Admin session cookie (existing admin system)
 * 3. EasyAuth headers (legacy)
 * 4. Bearer token (legacy Office SSO)
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  // PRIORITY 1: Check for JWT token (new auth system)
  const jwtToken = extractJWT(
    request.headers,
    request.headers.get('cookie') || undefined
  );

  if (jwtToken) {
    try {
      const payload = await validateJWT(jwtToken);

      // Check if user is admin
      if (!payload.isAdmin) {
        await createAuditLog({
          action: 'UNAUTHORIZED_ACCESS',
          adminEmail: payload.email,
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
            reason: 'User is not an admin',
          },
        });

        return {
          authenticated: false,
          session: null,
          response: NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          ),
        };
      }

      // Verify admin still exists in database
      const adminExists = await isAdmin(payload.email);
      if (!adminExists) {
        await createAuditLog({
          action: 'UNAUTHORIZED_ACCESS',
          adminEmail: payload.email,
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
            reason: 'Admin removed from database',
          },
        });

        return {
          authenticated: false,
          session: null,
          response: NextResponse.json(
            { error: 'Admin access revoked' },
            { status: 403 }
          ),
        };
      }

      // Return success with JWT session
      const jwtSession: AdminSession = {
        email: payload.email,
        isEmergency: false,
        exp: payload.exp || Math.floor(Date.now() / 1000) + 60 * 60,
      };

      return {
        authenticated: true,
        session: jwtSession,
      };
    } catch (error) {
      // JWT validation failed - fall through to legacy auth
      console.error('JWT validation failed in admin middleware:', error);
    }
  }

  // PRIORITY 2: Check existing admin session cookie
  const session = await getAdminSession(request);

  if (session) {
    if (!session.isEmergency) {
      const adminExists = await isAdmin(session.email);

      if (!adminExists) {
        await createAuditLog({
          action: 'UNAUTHORIZED_ACCESS',
          adminEmail: session.email,
          metadata: {
            path: request.nextUrl.pathname,
            method: request.method,
            reason: 'Admin removed from database',
          },
        });

        return {
          authenticated: false,
          session: null,
          response: NextResponse.json(
            { error: 'Admin access revoked' },
            { status: 403 }
          ),
        };
      }
    }

    return {
      authenticated: true,
      session,
    };
  }

  // PRIORITY 3: Try EasyAuth (legacy)
  let email = getEmailFromEasyAuth(request);

  // PRIORITY 4: Try Bearer token (legacy Office SSO)
  if (!email) {
    email = getEmailFromBearerToken(request);
  }

  if (email) {
    const adminExists = await isAdmin(email);
    if (adminExists) {
      const aadSession: AdminSession = {
        email,
        isEmergency: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      };

      return {
        authenticated: true,
        session: aadSession,
      };
    }
  }

  await createAuditLog({
    action: 'UNAUTHORIZED_ACCESS',
    adminEmail: email ?? 'anonymous',
    metadata: {
      path: request.nextUrl.pathname,
      method: request.method,
      reason: email ? 'AAD identity not found in admin table' : 'Missing admin session',
    },
  });

  return {
    authenticated: false,
    session: null,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}

/**
 * Higher-order function to protect API routes
 * Usage: export const GET = withAdminAuth(async (request, session) => { ... })
 */
export function withAdminAuth(
  handler: (request: NextRequest, session: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await verifyAdminAuth(request);

    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }

    return handler(request, authResult.session);
  };
}
