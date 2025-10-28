import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(
      {
        ok: true,
        status: 200,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        uptime: process.uptime(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
