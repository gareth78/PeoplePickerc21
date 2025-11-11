export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { searchUsers } from '@/lib/okta';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import type { SearchResult } from '@/lib/types';
import { requireAuth } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Require JWT authentication
  const authResult = await requireAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }
  const user = authResult.user;
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
    const result = await searchUsers(normalizedQuery, limit, cursor);

    // Filter out users hidden from Global Address List
    const visibleUsers = result.users.filter(user => {
      // Treat null/undefined as visible (show the user)
      // Filter out users where hideFromGAL is true or 'true' (handle both boolean and string values)
      const hidden = user.hideFromGAL === true || user.hideFromGAL === 'true';
      return !hidden;
    });

    // Update result with filtered users
    const filteredResult = {
      ...result,
      users: visibleUsers,
      totalCount: visibleUsers.length,
    };

    // Store in cache (don't wait for it)
    cacheSet(cacheKey, filteredResult, TTL.SEARCH).catch(err =>
      console.error('Failed to cache search result:', err)
    );

    return NextResponse.json({
      ok: true,
      data: filteredResult,
      meta: {
        count: filteredResult.users.length,
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
