import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE admin
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // Verify admin auth first
  const authResult = await withAdminAuth(async (req, session) => {
    return NextResponse.json({ session });
  })(request);

  if (authResult.status === 401 || authResult.status === 403) {
    return authResult;
  }

  const sessionData = await authResult.json();
  const session = sessionData.session;

  try {
    const { id } = await context.params;

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
