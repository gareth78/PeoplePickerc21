import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdmin,
  getAllAdmins,
  addAdmin,
  removeAdmin,
} from '@/lib/auth/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/users
 * Get list of all admin users
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  // Check admin authorization
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const admins = await getAllAdmins();

    return NextResponse.json(
      {
        ok: true,
        data: admins,
        meta: {
          count: admins.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin/users] GET error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to retrieve admin users',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Add a new admin user
 * Body: { email: string }
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  // Check admin authorization
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    const added = await addAdmin(email);

    return NextResponse.json(
      {
        ok: true,
        data: {
          email: email.toLowerCase(),
          added,
          message: added
            ? 'Admin added successfully'
            : 'Admin already exists',
        },
      },
      { status: added ? 201 : 200 }
    );
  } catch (error: any) {
    console.error('[admin/users] POST error:', error);

    // Handle validation errors
    if (error.message?.includes('Invalid email') ||
        error.message?.includes('Email is required') ||
        error.message?.includes('already a super admin')) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to add admin user',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Remove an admin user
 * Body: { email: string }
 * Cannot remove super admins
 * Requires admin authentication
 */
export async function DELETE(request: NextRequest) {
  // Check admin authorization
  const adminCheck = await requireAdmin(request);
  if (adminCheck) return adminCheck;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    const removed = await removeAdmin(email);

    return NextResponse.json(
      {
        ok: true,
        data: {
          email: email.toLowerCase(),
          removed,
          message: removed
            ? 'Admin removed successfully'
            : 'Admin not found',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[admin/users] DELETE error:', error);

    // Handle super admin removal attempt
    if (error.message?.includes('Cannot remove super admin')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Cannot remove super admin',
        },
        { status: 403 }
      );
    }

    // Handle validation errors
    if (error.message?.includes('Email is required')) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to remove admin user',
      },
      { status: 500 }
    );
  }
}
