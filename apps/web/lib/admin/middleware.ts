import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isAdmin, AdminSession } from './auth';
import { createAuditLog } from './audit';
import { getEmailFromEasyAuth, getEmailFromBearerToken } from './easyauth';

interface AdminAuthResult {
  authenticated: boolean;
  session: Awaited<ReturnType<typeof getAdminSession>>;
  response?: NextResponse;
}

/**
 * Verify admin authentication for API routes
 * Returns authentication status and optionally a response to return
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
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

  // Try EasyAuth first
  let email = getEmailFromEasyAuth(request);

  // If not found, try Bearer token
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
