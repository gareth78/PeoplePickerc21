import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/auth';

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
