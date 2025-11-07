import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);
const SESSION_COOKIE_NAME = 'admin_token';

export interface AdminSession {
  email: string;
  isEmergency: boolean;
  exp: number;
}

function extractTokenFromRequest(req: Request | NextRequest): string | null {
  const anyReq = req as NextRequest & { cookies?: { get?: (name: string) => { value?: string } | undefined } };
  if (anyReq?.cookies?.get) {
    const cookie = anyReq.cookies.get(SESSION_COOKIE_NAME);
    if (cookie?.value) {
      return cookie.value;
    }
  }

  const header = req.headers.get('cookie');
  if (!header) {
    return null;
  }

  const parts = header.split(';');
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === SESSION_COOKIE_NAME) {
      return rest.length > 0 ? decodeURIComponent(rest.join('=')) : '';
    }
  }

  return null;
}

/**
 * Create a JWT token for an admin session
 */
export async function createAdminToken(email: string, isEmergency: boolean = false): Promise<string> {
  const token = await new SignJWT({ email, isEmergency })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(isEmergency ? '1h' : '24h') // Emergency sessions expire in 1 hour
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      email: payload.email as string,
      isEmergency: payload.isEmergency as boolean,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get the current admin session from cookies
 */
export async function getAdminSession(req?: Request | NextRequest): Promise<AdminSession | null> {
  if (req) {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return null;
    }

    return verifyAdminToken(token);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifyAdminToken(token.value);
}

/**
 * Set the admin session cookie
 */
export async function setAdminSession(email: string, isEmergency: boolean = false): Promise<void> {
  const token = await createAdminToken(email, isEmergency);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: isEmergency ? 60 * 60 : 60 * 60 * 24, // 1 hour for emergency, 24 hours for normal
    path: '/',
  });
}

/**
 * Clear the admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function createJwtForEmail(email: string, isEmergency: boolean = false) {
  return createAdminToken(email, isEmergency);
}

export function setSessionCookie(
  res: NextResponse,
  token: string,
  isEmergency: boolean = false
) {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: isEmergency ? 60 * 60 : 60 * 60 * 24,
    path: '/',
  });
}

export async function hasValidSession(req: Request | NextRequest): Promise<boolean> {
  const session = await getAdminSession(req);
  return session !== null;
}

/**
 * Check if a user is an admin (exists in the admins table)
 */
export async function isAdmin(email: string): Promise<boolean> {
  console.log('[ADMIN DEBUG] Checking email:', email);
  console.log('[ADMIN DEBUG] Prisma client status:', prisma ? 'initialized' : 'not initialized');

  try {
    const normalizedEmail = email.toLowerCase();
    console.log('[ADMIN DEBUG] Executing query: prisma.admin.findUnique({ where: { email:', normalizedEmail, '} })');

    const admin =
      (await prisma.admin.findUnique({
        where: { email: normalizedEmail },
      })) ??
      (await prisma.admin.findUnique({
        where: { email },
      }));

    console.log('[ADMIN DEBUG] Query result:', admin);

    return !!admin;
  } catch (error) {
    console.log('[ADMIN DEBUG] Error occurred during admin check');
    console.log('[ADMIN DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.log('[ADMIN DEBUG] Full stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('[ADMIN DEBUG] Error object:', error);
    throw error;
  }
}

/**
 * Verify emergency break-glass credentials
 */
export function verifyBreakGlassCredentials(email: string, password: string): boolean {
  const breakGlassEmail = process.env.BREAK_GLASS_EMAIL;
  const breakGlassPassword = process.env.BREAK_GLASS_PASSWORD;

  if (!breakGlassEmail || !breakGlassPassword) {
    console.error('Break glass credentials not configured');
    return false;
  }

  return email === breakGlassEmail && password === breakGlassPassword;
}

/**
 * Verify emergency URL token
 */
export function verifyEmergencyToken(token: string): boolean {
  const breakGlassToken = process.env.BREAK_GLASS_URL_TOKEN;

  if (!breakGlassToken) {
    console.error('Break glass URL token not configured');
    return false;
  }

  return token === breakGlassToken;
}
