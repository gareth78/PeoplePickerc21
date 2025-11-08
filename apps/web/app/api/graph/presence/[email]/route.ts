import { NextResponse } from 'next/server';
import { getGraphClient } from '@/lib/graph';
import { getRedisClient, TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const parseBoolean = (value: string | null): boolean => {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const clampTtl = (ttl: number | null | undefined): number => {
  if (ttl == null || Number.isNaN(ttl)) {
    return TTL.PRESENCE;
  }

  return Math.min(Math.max(ttl, 30), 300);
};

interface PresenceCacheEntry {
  activity: string | null;
  availability: string | null;
  fetchedAt: string;
  ttl: number;
}

const isCacheEntryFresh = (entry: PresenceCacheEntry, ttlSeconds: number): boolean => {
  if (!entry.fetchedAt) {
    return false;
  }

  const fetchedAt = new Date(entry.fetchedAt);
  if (Number.isNaN(fetchedAt.getTime())) {
    return false;
  }

  const ageMs = Date.now() - fetchedAt.getTime();
  return ageMs <= ttlSeconds * 1000;
};

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const rawEmail = decodeURIComponent(params.email);
    const normalizedEmail = rawEmail.toLowerCase().trim();
    const cacheKey = `presence:${normalizedEmail}`;
    const url = new URL(request.url);
    const noCache = parseBoolean(url.searchParams.get('noCache'));
    const requestedTtl = clampTtl(Number(url.searchParams.get('ttl')));

    const redis = getRedisClient();

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          const cachedEntry = JSON.parse(cached) as PresenceCacheEntry;
          const entryTtl = cachedEntry.ttl ?? TTL.PRESENCE;
          const effectiveTtl = noCache ? requestedTtl : entryTtl;

          if (!noCache || isCacheEntryFresh(cachedEntry, effectiveTtl)) {
            return NextResponse.json({
              ok: true,
              data: {
                activity: cachedEntry.activity ?? null,
                availability: cachedEntry.availability ?? null,
                fetchedAt: cachedEntry.fetchedAt,
                ttl: effectiveTtl,
                cached: true,
              },
              meta: {
                cached: true,
                ttl: effectiveTtl,
              },
            });
          }
        } catch (error) {
          console.warn('Failed to parse cached presence entry', error);
        }
      }
    }

    const client = await getGraphClient();
    const user = await client.api(`/users/${normalizedEmail}`).select('id').get();
    const presence = await client.api(`/users/${user.id}/presence`).get();

    const fetchedAt = new Date().toISOString();
    const responsePayload = {
      activity: presence.activity ?? null,
      availability: presence.availability ?? null,
      fetchedAt,
      ttl: requestedTtl,
      cached: false,
    };

    if (redis) {
      const cacheEntry: PresenceCacheEntry = {
        activity: responsePayload.activity,
        availability: responsePayload.availability,
        fetchedAt,
        ttl: requestedTtl,
      };

      await redis.setex(cacheKey, requestedTtl, JSON.stringify(cacheEntry));
    }

    return NextResponse.json({
      ok: true,
      data: responsePayload,
      meta: {
        cached: false,
        ttl: requestedTtl,
      },
    });
  } catch (error: any) {
    if (error.statusCode === 403 || error.statusCode === 404) {
      return NextResponse.json(
        {
          ok: false,
          data: null,
        },
        { status: 200 }
      );
    }

    console.error('Failed to fetch presence:', error);
    return NextResponse.json(
      {
        ok: false,
        data: null,
        error: 'presence_fetch_failed',
      },
      { status: 200 }
    );
  }
}
