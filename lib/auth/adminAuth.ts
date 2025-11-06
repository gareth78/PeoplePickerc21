import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

/**
 * Get list of super admins from environment variable
 * Super admins cannot be removed and have full access
 */
function getSuperAdmins(): string[] {
  const superAdminsEnv =
    process.env.SUPER_ADMINS ?? process.env.NEXT_PUBLIC_SUPER_ADMINS ?? '';

  if (!process.env.SUPER_ADMINS && process.env.NEXT_PUBLIC_SUPER_ADMINS) {
    console.warn(
      '[adminAuth] NEXT_PUBLIC_SUPER_ADMINS is deprecated. Please use SUPER_ADMINS instead.'
    );
  }
  return superAdminsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if an email is a super admin
 */
export function isSuperAdmin(email: string): boolean {
  const superAdmins = getSuperAdmins();
  return superAdmins.includes(email.toLowerCase());
}

/**
 * Check if a user email is an admin
 * Checks both Redis admin set and super admin environment variable
 */
export async function isAdmin(email: string): Promise<boolean> {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();

  // Check if super admin
  if (isSuperAdmin(normalizedEmail)) {
    return true;
  }

  // Check Redis admin set
  try {
    const redis = getRedisClient();
    if (!redis) {
      console.error('[adminAuth] Redis client not available');
      return false;
    }

    const isInAdminSet = await redis.sismember('admins', normalizedEmail);
    return isInAdminSet === 1;
  } catch (error) {
    console.error('[adminAuth] Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all admin emails (from Redis + super admins)
 * Returns array of objects with email and isSuperAdmin flag
 */
export async function getAllAdmins(): Promise<
  Array<{ email: string; isSuperAdmin: boolean }>
> {
  const superAdmins = getSuperAdmins();
  const admins: Array<{ email: string; isSuperAdmin: boolean }> = [];

  // Add super admins first
  superAdmins.forEach((email) => {
    admins.push({ email, isSuperAdmin: true });
  });

  // Get regular admins from Redis
  try {
    const redis = getRedisClient();
    if (redis) {
      const redisAdmins = await redis.smembers('admins');
      redisAdmins.forEach((email) => {
        // Don't duplicate super admins
        if (!isSuperAdmin(email)) {
          admins.push({ email: email.toLowerCase(), isSuperAdmin: false });
        }
      });
    }
  } catch (error) {
    console.error('[adminAuth] Error getting admin list:', error);
  }

  // Sort by email
  return admins.sort((a, b) => a.email.localeCompare(b.email));
}

/**
 * Add an email to the admin list in Redis
 */
export async function addAdmin(email: string): Promise<boolean> {
  if (!email) {
    throw new Error('Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const normalizedEmail = email.toLowerCase();

  // Check if already a super admin
  if (isSuperAdmin(normalizedEmail)) {
    throw new Error('User is already a super admin');
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      throw new Error('Redis client not available');
    }

    // Add to admin set (no TTL - permanent storage)
    const result = await redis.sadd('admins', normalizedEmail);
    console.log(`[adminAuth] Added admin: ${normalizedEmail}`);
    return result === 1;
  } catch (error) {
    console.error('[adminAuth] Error adding admin:', error);
    throw error;
  }
}

/**
 * Remove an email from the admin list in Redis
 * Cannot remove super admins
 */
export async function removeAdmin(email: string): Promise<boolean> {
  if (!email) {
    throw new Error('Email is required');
  }

  const normalizedEmail = email.toLowerCase();

  // Prevent removing super admins
  if (isSuperAdmin(normalizedEmail)) {
    throw new Error('Cannot remove super admin');
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      throw new Error('Redis client not available');
    }

    // Remove from admin set
    const result = await redis.srem('admins', normalizedEmail);
    console.log(`[adminAuth] Removed admin: ${normalizedEmail}`);
    return result === 1;
  } catch (error) {
    console.error('[adminAuth] Error removing admin:', error);
    throw error;
  }
}

/**
 * Extract user email from Azure Easy Auth header
 */
export function getUserEmailFromRequest(request: NextRequest): string | null {
  try {
    const principalHeader = request.headers.get('x-ms-client-principal');
    if (!principalHeader) {
      return null;
    }

    const principalJson = Buffer.from(principalHeader, 'base64').toString('utf-8');
    const principal = JSON.parse(principalJson);

    // Extract email from various possible locations
    const userEmail =
      principal.userDetails ||
      principal.userId ||
      principal.claims?.find((c: any) =>
        c.typ?.includes('emailaddress')
      )?.val;

    return userEmail ? userEmail.toLowerCase() : null;
  } catch (error) {
    console.error('[adminAuth] Error extracting user email:', error);
    return null;
  }
}

/**
 * Middleware to require admin access for API routes
 * Returns 403 Forbidden if user is not an admin
 *
 * Usage:
 * export async function GET(request: NextRequest) {
 *   const adminCheck = await requireAdmin(request);
 *   if (adminCheck) return adminCheck;
 *   // ... rest of handler
 * }
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const userEmail = getUserEmailFromRequest(request);

  if (!userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const adminStatus = await isAdmin(userEmail);

  if (!adminStatus) {
    console.warn(`[adminAuth] Unauthorized admin access attempt by: ${userEmail}`);
    return NextResponse.json(
      { ok: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  // User is admin, allow request to proceed
  return null;
}
