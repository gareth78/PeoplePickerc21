import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const stats = await cache.stats();

    const envSnapshot = {
      'cache-ttl-seconds (kebab)': process.env['cache-ttl-seconds'] ?? null,
      'CACHE_TTL_SECONDS (upper)': process.env.CACHE_TTL_SECONDS ?? null,
      'cache-type (kebab)': process.env['cache-type'] ?? null,
      'CACHE_TYPE (upper)': process.env.CACHE_TYPE ?? null,
    };

    return NextResponse.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
        cache: {
          type: cache.cacheType,
          defaultTtlSeconds: cache.defaultTtlSeconds,
          stats,
        },
        environment: {
          nodeVersion: process.version,
          nodeEnv: process.env.NODE_ENV ?? 'development',
          variables: envSnapshot,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load cache debug information.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
