import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin/middleware';
import { getRecentAuditLogs } from '@/lib/admin/audit';
import { createAuditLog } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withAdminAuth(async (request: NextRequest, session) => {
  try {
    await createAuditLog({
      action: 'VIEW_AUDIT_LOGS',
      adminEmail: session.email,
      metadata: { type: 'recent_activity' },
    });

    const activities = await getRecentAuditLogs(20);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
});
