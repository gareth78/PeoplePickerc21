import { NextResponse } from 'next/server';
import { searchUsers } from '@/lib/okta';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import type { SearchResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cursor = searchParams.get('cursor') || undefined;
    const orgFilter = searchParams.get('org');

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
    const cacheKey = `search:${normalizedQuery}:${cursor ?? 'first'}`;

    // Try to get from cache
    const cached = await cacheGet<SearchResult>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: cached,
        meta: {
          count: cached.users.length,
          cached: true,
        },
      });
    }

    // Fetch from Okta
    const configuredLimit = Number(process.env['search-results-limit']);
    const limit = Number.isFinite(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : 100;
    let result = await searchUsers(normalizedQuery, limit, cursor);

    // ONLY filter by org if parameter is explicitly provided and not empty
    if (orgFilter && orgFilter.trim() !== '') {
      const filteredUsers = result.users.filter(user =>
        user.organization?.toLowerCase().trim() === orgFilter.toLowerCase().trim()
      );
      result = {
        ...result,
        users: filteredUsers,
        totalCount: filteredUsers.length,
      };
    }

    // Store in cache (don't wait for it)
    cacheSet(cacheKey, result, TTL.SEARCH).catch(err =>
      console.error('Failed to cache search result:', err)
    );

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
