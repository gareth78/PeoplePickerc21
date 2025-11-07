import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: { id: string };
}

// DELETE admin
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // Verify admin auth first
  const authResult = await verifyAdminAuth(request);

  if (!authResult.authenticated || !authResult.session) {
    return authResult.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = authResult.session;

  try {
    const { id } = context.params;

    // Find the admin to delete
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Prevent deleting yourself
    if (admin.email === session.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    // Delete the admin
    await prisma.admin.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'DELETE_ADMIN',
      adminEmail: session.email,
      targetEmail: admin.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
