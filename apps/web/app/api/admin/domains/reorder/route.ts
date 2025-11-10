import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await verifyAdminAuth(request);
  if (!authResult.authenticated || !authResult.session) {
    return authResult.response!;
  }

  const admin = authResult.session;

  try {
    const body = await request.json();
    const { domains } = body;

    if (!Array.isArray(domains)) {
      return NextResponse.json(
        { error: 'Invalid request: domains must be an array' },
        { status: 400 }
      );
    }

    // Update each domain's priority
    await Promise.all(
      domains.map((domain: { id: string; priority: number }) =>
        prisma.smtpDomain.update({
          where: { id: domain.id },
          data: { priority: domain.priority },
        })
      )
    );

    // Create audit log
    await createAuditLog({
      adminEmail: admin.email,
      action: 'REORDER_SMTP_DOMAINS',
      metadata: {
        domainCount: domains.length,
        newOrder: domains.map((d: { id: string; priority: number }) => ({
          id: d.id,
          priority: d.priority,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Domain order updated successfully',
    });
  } catch (error) {
    console.error('Error reordering domains:', error);
    return NextResponse.json(
      { error: 'Failed to reorder domains' },
      { status: 500 }
    );
  }
}
