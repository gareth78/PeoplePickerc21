import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { getUserById } from '@/lib/okta';
import type { User } from '@/lib/types';

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'id' in value && 'email' in value && 'displayName' in value;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cacheKey = `user:${params.id}`;
    const cacheTTL = Number(process.env.CACHE_TTL_SECONDS || 600);

    const cached = await cache.get(cacheKey);
    if (isUser(cached)) {
      return NextResponse.json({
        ok: true,
        data: cached,
        meta: {
          cached: true,
        },
      });
    }

    const user = await getUserById(params.id);
    await cache.set(cacheKey, user, cacheTTL);

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
        error: error instanceof Error ? error.message : 'User not found',
      },
      { status: 404 }
    );
  }
}
