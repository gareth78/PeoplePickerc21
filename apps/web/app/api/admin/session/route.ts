import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEmailFromEasyAuth } from '@/lib/admin/easyauth';
import { createJwtForEmail, setSessionCookie, getAdminSession } from '@/lib/admin/auth';
import { extractJWT, validateJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (session) {
      return NextResponse.json({ authenticated: true, mode: 'cookie', session });
    }

    // Step 2: Check JWT token from Microsoft OAuth
    const token = extractJWT(req.headers, req.headers.get('cookie') || undefined);
    if (token) {
      try {
        const jwt = await validateJWT(token);
        if (jwt.email) {
          const normalized = jwt.email.toLowerCase();
          const admin =
            (await prisma.admin.findUnique({ where: { email: normalized } })) ??
            (await prisma.admin.findUnique({ where: { email: jwt.email } }));

          if (admin) {
            const adminToken = await createJwtForEmail(jwt.email);
            const response = NextResponse.json({
              authenticated: true,
              mode: 'jwt',
              email: jwt.email,
              session: {
                email: jwt.email,
                isAdmin: true,
                isEmergency: false,
                exp: jwt.exp || Math.floor(Date.now() / 1000) + 60 * 60 * 24,
              },
            });
            setSessionCookie(response, adminToken);
            return response;
          }
        }
      } catch (error) {
        console.error('JWT validation error:', error);
        // Continue to EasyAuth fallback
      }
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
