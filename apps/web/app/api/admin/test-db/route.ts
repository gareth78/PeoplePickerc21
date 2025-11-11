import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('[TEST-DB] Starting database test');
  console.log('[TEST-DB] Timestamp:', new Date().toISOString());

  try {
    // Log Prisma client status
    console.log('[TEST-DB] Prisma client status:', {
      isConnected: !!prisma,
      clientType: typeof prisma,
    });

    console.log('[TEST-DB] Attempting to query admins table...');

    // Query all admins from the database
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        createdBy: true,
      },
    });

    console.log('[TEST-DB] Query successful');
    console.log('[TEST-DB] Query result:', {
      count: admins.length,
      adminUsernames: admins.map((a: typeof admins[0]) => a.username),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      count: admins.length,
      admins: admins,
      timestamp: new Date().toISOString(),
      message: 'Database query successful',
    });

  } catch (error) {
    // Log the error with full details
    console.error('[TEST-DB] Error occurred:', error);
    console.error('[TEST-DB] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[TEST-DB] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[TEST-DB] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return error response with detailed information
    return NextResponse.json(
      {
        success: false,
        count: 0,
        admins: null,
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'UnknownError',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
