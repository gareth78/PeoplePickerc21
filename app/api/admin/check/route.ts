import { NextRequest, NextResponse } from 'next/server';
import { getUserEmailFromRequest, isAdmin } from '@/lib/auth/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/check
 * Check if the current user is an admin
 * Returns { isAdmin: boolean, email: string }
 */
export async function GET(request: NextRequest) {
  try {
    const userEmail = getUserEmailFromRequest(request);

    if (!userEmail) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            isAdmin: false,
            email: null,
          },
        },
        { status: 200 }
      );
    }

    const adminStatus = await isAdmin(userEmail);

    return NextResponse.json(
      {
        ok: true,
        data: {
          isAdmin: adminStatus,
          email: userEmail,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin/check] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to check admin status',
      },
      { status: 500 }
    );
  }
}
