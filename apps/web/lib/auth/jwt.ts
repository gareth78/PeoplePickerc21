import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

// Token expiry: 4 hours (configurable)
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '4h';

export interface JWTPayload {
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for authenticated users
 * @param email - User's email address
 * @param isAdmin - Whether the user has admin privileges
 * @returns JWT token string
 */
export async function generateJWT(email: string, isAdmin: boolean): Promise<string> {
  try {
    const token = await new SignJWT({ email, isAdmin })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(secret);

    return token;
  } catch (error) {
    console.error('Failed to generate JWT:', error);
    throw new Error('Token generation failed');
  }
}

/**
 * Validate and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload with email and isAdmin flag
 * @throws Error if token is invalid or expired
 */
export async function validateJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      email: payload.email as string,
      isAdmin: payload.isAdmin as boolean,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error('JWT validation failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Refresh a JWT token
 * Validates the current token and issues a new one if valid
 * Security: Don't refresh tokens older than 7 days
 * @param token - Current JWT token
 * @returns New JWT token
 * @throws Error if token is invalid or too old
 */
export async function refreshJWT(token: string): Promise<string> {
  try {
    // First verify the token signature (even if expired, we need valid signature)
    const { payload } = await jwtVerify(token, secret, {
      // Allow expired tokens for refresh
      clockTolerance: 60 * 60 * 24 * 7, // 7 days
    });

    const email = payload.email as string;
    const isAdmin = payload.isAdmin as boolean;
    const iat = payload.iat as number;

    // Security check: don't refresh tokens older than 7 days
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - iat;
    const maxRefreshAge = 7 * 24 * 60 * 60; // 7 days in seconds

    if (tokenAge > maxRefreshAge) {
      throw new Error('Token too old to refresh');
    }

    // Issue new token
    return generateJWT(email, isAdmin);
  } catch (error) {
    console.error('JWT refresh failed:', error);
    throw new Error('Token refresh failed');
  }
}

/**
 * Extract JWT from Authorization header or cookie
 * @param headers - Request headers
 * @param cookies - Request cookies
 * @returns JWT token string or null
 */
export function extractJWT(
  headers: Headers,
  cookies?: string
): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie (for web client)
  if (cookies) {
    const jwtCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('jwt='));

    if (jwtCookie) {
      return jwtCookie.split('=')[1];
    }
  }

  return null;
}
