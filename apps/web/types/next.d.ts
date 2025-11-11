import { NextRequest } from 'next/server';

/**
 * Type extensions for Next.js server types
 *
 * Note: Currently, our auth middleware uses a different pattern.
 * Instead of attaching user to NextRequest, we return an AuthResult
 * object that routes can destructure.
 *
 * This type declaration is provided for future extensibility and
 * documentation purposes.
 *
 * Current pattern (recommended):
 * ```typescript
 * const authResult = await requireAuth(request);
 * if (!authResult.authorized) return authResult.response;
 * const user = authResult.user;
 * ```
 *
 * Alternative pattern (if ever needed):
 * ```typescript
 * request.user = { email, isAdmin };
 * ```
 */
declare module 'next/server' {
  interface NextRequest {
    /**
     * Optional user object attached to request after authentication
     * @deprecated Use the AuthResult pattern from requireAuth() instead
     */
    user?: {
      email: string;
      isAdmin: boolean;
      iat?: number;
      exp?: number;
    };
  }
}
