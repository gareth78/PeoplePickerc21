import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const { email, username } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check if admin already exists by email
    const existingByEmail = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingByUsername = await prisma.admin.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        username: normalizedUsername,
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
