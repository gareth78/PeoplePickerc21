import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEmailFromEasyAuth } from '@/lib/admin/easyauth';
import { createJwtForEmail, setSessionCookie, getAdminSession } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (session) {
      return NextResponse.json({ authenticated: true, mode: 'cookie', session });
    }

    const email = getEmailFromEasyAuth(req);
    if (!email) {
      return NextResponse.json({ authenticated: false, reason: 'no-aad' });
    }

    const normalized = email.toLowerCase();
    const admin =
      (await prisma.admin.findUnique({ where: { email: normalized } })) ??
      (await prisma.admin.findUnique({ where: { email } }));

    if (!admin) {
      return NextResponse.json({ authenticated: false, reason: 'not-admin', email });
    }

    const jwt = await createJwtForEmail(email);
    const response = NextResponse.json({
      authenticated: true,
      mode: 'aad-bootstrap',
      email,
      session: {
        email,
        isEmergency: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
    });
    setSessionCookie(response, jwt);
    return response;
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
