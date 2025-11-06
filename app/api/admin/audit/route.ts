import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin/middleware';
import { getRecentAuditLogs, createAuditLog } from '@/lib/admin/audit';

export const GET = withAdminAuth(async (request: NextRequest, session) => {
  try {
    await createAuditLog({
      action: 'VIEW_AUDIT_LOGS',
      adminEmail: session.email,
      metadata: { type: 'full_audit_view' },
    });

    const logs = await getRecentAuditLogs(200);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
});
