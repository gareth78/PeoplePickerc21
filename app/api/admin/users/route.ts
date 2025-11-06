import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

// GET all admins
export const GET = withAdminAuth(async (request: NextRequest, session) => {
  try {
    await createAuditLog({
      action: 'VIEW_ADMINS',
      adminEmail: session.email,
    });

    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Admins fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
});

// POST - Create new admin
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Admin already exists' },
        { status: 409 }
      );
    }

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        email: normalizedEmail,
        createdBy: session.email,
      },
    });

    await createAuditLog({
      action: 'CREATE_ADMIN',
      adminEmail: session.email,
      targetEmail: normalizedEmail,
    });

    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
});
