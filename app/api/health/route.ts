import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cacheStats = await cache.stats();

    return NextResponse.json(
      {
        ok: true,
        status: 200,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        cacheType: cache.cacheType,
        uptime: process.uptime(),
        cache: cacheStats,
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
