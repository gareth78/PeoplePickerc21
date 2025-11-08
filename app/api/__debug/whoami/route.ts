import { NextResponse } from 'next/server';
import { getEmailFromEasyAuth } from '@/lib/admin/easyauth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return NextResponse.json({ email: getEmailFromEasyAuth(req) });
}
