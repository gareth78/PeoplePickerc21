import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/okta';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import type { User } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cacheKey = `user:${params.id}`;

    // Try to get from cache
    const cached = await cacheGet<User>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: cached,
        meta: {
          cached: true,
        },
      });
    }

    // Fetch from Okta
    const user = await getUserById(params.id);

    // Store in cache
    cacheSet(cacheKey, user, TTL.PROFILE).catch(err =>
      console.error('Failed to cache user:', err)
    );

    return NextResponse.json({
      ok: true,
      data: user,
      meta: {
        cached: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
      },
      { status: 500 }
    );
  }
}
