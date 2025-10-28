import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { searchUsers } from '@/lib/okta';
import type { SearchResult } from '@/lib/types';

function isSearchResult(value: unknown): value is SearchResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (!('users' in value) || !Array.isArray((value as { users?: unknown }).users)) {
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const cacheKey = 'sample-users';
    const cacheTTL = Number(process.env.CACHE_TTL_SECONDS || 600);

    const cached = await cache.get(cacheKey);
    if (isSearchResult(cached)) {
      return NextResponse.json({
        ok: true,
        data: cached,
        meta: {
          count: cached.users.length,
          cached: true,
        },
      });
    }

    const result = await searchUsers('', 5);
    await cache.set(cacheKey, result, cacheTTL);

    return NextResponse.json({
      ok: true,
      data: result,
      meta: {
        count: result.users.length,
        cached: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sample',
      },
      { status: 500 }
    );
  }
}
