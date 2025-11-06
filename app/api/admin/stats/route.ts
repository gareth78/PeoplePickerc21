import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin/middleware';
import prisma from '@/lib/prisma';

export const GET = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalAdmins, totalAuditLogs, recentLogins, emergencyAccesses] =
      await Promise.all([
        prisma.admin.count(),
        prisma.auditLog.count(),
        prisma.auditLog.count({
          where: {
            action: 'LOGIN',
            createdAt: { gte: oneDayAgo },
          },
        }),
        prisma.auditLog.count({
          where: {
            action: { in: ['BREAK_GLASS_ACCESS', 'BREAK_GLASS_LOGIN'] },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

    return NextResponse.json({
      totalAdmins,
      totalAuditLogs,
      recentLogins,
      emergencyAccesses,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
});
