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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cursor = searchParams.get('cursor') || undefined;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const normalizedQuery = query.trim();
    const cacheKey = `users:${normalizedQuery}:${cursor ?? 'first'}`;
    const cacheTTL = Number(process.env['cache-ttl-seconds'] || 600);

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

    const result = await searchUsers(normalizedQuery, 10, cursor);

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
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
