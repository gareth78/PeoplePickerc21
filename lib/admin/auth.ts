import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface AdminSession {
  email: string;
  isEmergency: boolean;
  exp: number;
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
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

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

  cookieStore.set('admin_token', token, {
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
  cookieStore.delete('admin_token');
}

/**
 * Check if a user is an admin (exists in the admins table)
 */
export async function isAdmin(email: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  return !!admin;
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
