import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEmailFromEasyAuth } from '@/lib/admin/easyauth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const email = getEmailFromEasyAuth(req);
  if (!email) return NextResponse.json({ isAdmin: false, email: null });

  const e = email.toLowerCase();
  const admin =
    (await prisma.admin.findUnique({ where: { email: e } })) ??
    (await prisma.admin.findUnique({ where: { email } }));

  return NextResponse.json({ isAdmin: !!admin, email });
}
