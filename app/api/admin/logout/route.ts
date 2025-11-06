import { NextResponse } from 'next/server';
import { getAdminSession, clearAdminSession } from '@/lib/admin/auth';
import { createAuditLog } from '@/lib/admin/audit';

export async function POST() {
  try {
    const session = await getAdminSession();

    if (session) {
      await createAuditLog({
        action: 'LOGOUT',
        adminEmail: session.email,
        metadata: { isEmergency: session.isEmergency },
      });
    }

    await clearAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
