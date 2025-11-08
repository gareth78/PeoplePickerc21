import { NextResponse } from 'next/server';
import { searchUsers } from '@/lib/okta';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();

  try {
    await searchUsers('', 1);
    const latency = Date.now() - startTime;

    return NextResponse.json(
      {
        ok: true,
        data: {
          connected: true,
          latency,
        },
        meta: {
          latency,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    const latency = Date.now() - startTime;
    return NextResponse.json(
      {
        ok: false,
        data: {
          connected: false,
          latency,
        },
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
