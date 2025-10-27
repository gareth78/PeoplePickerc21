import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET() {
  try {
    const cacheStats = await cache.stats();

    return NextResponse.json({
      ok: true,
      status: 200,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      cacheType: process.env.CACHE_TYPE || process.env['cache-type'] || 'memory',
      uptime: process.uptime(),
      cache: cacheStats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
