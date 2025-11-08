import { NextResponse } from 'next/server';
import { getGraphClient } from '@/lib/graph';
import { getRedisClient, TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_TTL = 30;
const MAX_TTL = 300;

function clampTtl(value: number | null): number {
  if (!value || Number.isNaN(value)) {
    return TTL.PRESENCE;
  }
  return Math.min(MAX_TTL, Math.max(MIN_TTL, value));
}

export async function GET(request: Request, { params }: { params: { email: string } }) {
  try {
    const rawEmail = decodeURIComponent(params.email);
    const normalizedEmail = rawEmail.toLowerCase().trim();
    const cacheKey = `presence:${normalizedEmail}`;
    const redis = getRedisClient();

    const url = new URL(request.url);
    const noCache = ['1', 'true'].includes((url.searchParams.get('noCache') || '').toLowerCase());
    const ttlParam = url.searchParams.get('ttl');
    const ttlSeconds = clampTtl(ttlParam ? Number(ttlParam) : null);

    if (!noCache && redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { activity: string | null; availability: string | null; fetchedAt?: string };
        if (!parsed.fetchedAt) {
          parsed.fetchedAt = new Date().toISOString();
        }
        return NextResponse.json({ ok: true, data: parsed, meta: { cached: true } });
      }
    }

    const client = await getGraphClient();

    const user = await client.api(`/users/${normalizedEmail}`).select('id').get();

    const presence = await client.api(`/users/${user.id}/presence`).get();

    const presenceData = {
      activity: presence.activity ?? null,
      availability: presence.availability ?? null,
      fetchedAt: new Date().toISOString()
    };

    if (redis) {
      await redis.setex(cacheKey, ttlSeconds, JSON.stringify(presenceData));
    }

    return NextResponse.json({ ok: true, data: presenceData, meta: { cached: false } });
  } catch (error: any) {
    if (error.statusCode === 403 || error.statusCode === 404) {
      return NextResponse.json({ ok: false, data: null }, { status: 200 });
    }

    console.error('Failed to fetch presence:', error);
    return NextResponse.json({ ok: false, data: null }, { status: 200 });
  }
}
