/**
 * JWT Authentication Middleware
 *
 * This middleware implements JWT-based authentication for API routes.
 *
 * DESIGN DECISION: AuthResult Pattern vs Request Extension
 * ------------------------------------------------------
 * We use an AuthResult pattern that returns user data in the result object
 * rather than extending NextRequest with a user property. This approach:
 *
 * 1. Avoids TypeScript complications with module augmentation
 * 2. Makes the auth check explicit in each route handler
 * 3. Provides clear return types for better IDE support
 * 4. Allows flexible error handling per route
 *
 * See types/next.d.ts for the alternative NextRequest extension pattern.
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateJWT, extractJWT, JWTPayload } from './jwt';

export interface AuthUser extends JWTPayload {
  email: string;
  isAdmin: boolean;
}

export interface AuthResult {
  authorized: boolean;
  user?: AuthUser;
  response?: NextResponse;
}

/**
 * Require authentication middleware
 * Validates JWT token from Authorization header or cookie
 * Returns authorization status and user information
 *
 * Usage in API routes:
 * ```
 * export async function GET(req: NextRequest) {
 *   const authResult = await requireAuth(req);
 *   if (!authResult.authorized) return authResult.response;
 *   const user = authResult.user;
 *   // ... your API logic
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract JWT from Authorization header or cookie
    const token = extractJWT(
      request.headers,
      request.headers.get('cookie') || undefined
    );

    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      };
    }

    // Validate the JWT
    try {
      const payload = await validateJWT(token);

      return {
        authorized: true,
        user: {
          email: payload.email,
          isAdmin: payload.isAdmin,
          iat: payload.iat,
          exp: payload.exp,
        },
      };
    } catch (error) {
      // Token is invalid or expired
      console.error('Auth validation failed:', error);

      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid or expired token', code: 'TOKEN_INVALID' },
          { status: 401 }
        ),
      };
    }
  } catch (error) {
    console.error('Auth middleware error:', error);

    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication error', code: 'AUTH_ERROR' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Require admin middleware
 * First validates JWT, then checks if user is an admin
 *
 * Usage in API routes:
 * ```
 * export async function GET(req: NextRequest) {
 *   const authResult = await requireAdmin(req);
 *   if (!authResult.authorized) return authResult.response;
 *   const admin = authResult.user;
 *   // ... your admin API logic
 * }
 * ```
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  // First check authentication
  const authResult = await requireAuth(request);

  if (!authResult.authorized) {
    return authResult;
  }

  // Check if user is admin
  if (!authResult.user?.isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Admin access required', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Higher-order function to wrap API route handlers with auth
 *
 * Usage:
 * ```
 * export const GET = withAuth(async (request, user) => {
 *   // Your API logic here
 *   return NextResponse.json({ data: 'protected data' });
 * });
 * ```
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth(request);

    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    return handler(request, authResult.user);
  };
}

/**
 * Higher-order function to wrap API route handlers with admin auth
 *
 * Usage:
 * ```
 * export const GET = withAdminAuth(async (request, admin) => {
 *   // Your admin API logic here
 *   return NextResponse.json({ data: 'admin data' });
 * });
 * ```
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAdmin(request);

    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    return handler(request, authResult.user);
  };
}
