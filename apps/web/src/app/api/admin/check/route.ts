import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEmailFromEasyAuth } from '@/lib/admin/easyauth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const email = getEmailFromEasyAuth(req);
    if (!email) return NextResponse.json({ isAdmin: false, email: null });

    const e = email.toLowerCase();
    const admin =
      (await prisma.admin.findUnique({ where: { email: e } })) ??
      (await prisma.admin.findUnique({ where: { email } }));

    return NextResponse.json({ isAdmin: !!admin, email });
  } catch (err: any) {
    // Surface error for triage instead of opaque 500 page
    return NextResponse.json(
      { error: 'admin-check-failed', message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
