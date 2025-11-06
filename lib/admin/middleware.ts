import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, isAdmin } from './auth';
import { createAuditLog } from './audit';

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
  // Check for admin session
  const session = await getAdminSession();

  if (!session) {
    // Log unauthorized access attempt
    await createAuditLog({
      action: 'UNAUTHORIZED_ACCESS',
      adminEmail: 'anonymous',
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
      },
    });

    return {
      authenticated: false,
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // For non-emergency sessions, verify the user is still in the admins table
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
