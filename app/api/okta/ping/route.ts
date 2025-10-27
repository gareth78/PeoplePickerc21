import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { searchUsers } from '@/lib/okta';

const CACHE_KEY = 'okta-ping';

type PingCacheEntry = {
  ok: boolean;
  data: {
    connected: boolean;
    latency: number;
  };
  meta?: {
    latency?: number;
    cached?: boolean;
  };
  error?: string;
};

function isPingCacheEntry(value: unknown): value is PingCacheEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (!('data' in value)) {
    return false;
  }

  const data = (value as { data?: unknown }).data;
  return (
    typeof data === 'object' &&
    data !== null &&
    'connected' in data &&
    'latency' in data
  );
}

export async function GET() {
  const startTime = Date.now();

  try {
    const cached = await cache.get(CACHE_KEY);
    if (isPingCacheEntry(cached)) {
      return NextResponse.json({
        ...cached,
        meta: { ...(cached.meta ?? {}), cached: true },
      });
    }

    await searchUsers('', 1);
    const latency = Date.now() - startTime;

    const result: PingCacheEntry = {
      ok: true,
      data: {
        connected: true,
        latency,
      },
      meta: {
        latency,
        cached: false,
      },
    };

    await cache.set(CACHE_KEY, result, 60);
    return NextResponse.json(result);
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
      { status: 500 }
    );
  }
}
