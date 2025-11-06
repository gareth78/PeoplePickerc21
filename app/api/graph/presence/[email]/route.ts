import { NextResponse } from 'next/server';
import { getGraphClient } from '@/lib/graph';
import { getRedisClient, TTL } from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const rawEmail = decodeURIComponent(params.email);
    // Normalize email for consistent cache keys
    const normalizedEmail = rawEmail.toLowerCase().trim();
    const cacheKey = `presence:${normalizedEmail}`;
    const redis = getRedisClient();

    // Check cache first (5 minute TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ok: true, data: JSON.parse(cached) });
      }
    }

    // Fetch from Graph API
    const client = await getGraphClient();
    const presence = await client
      .api(`/users/${normalizedEmail}/presence`)
      .get();

    const presenceData = {
      activity: presence.activity,
      availability: presence.availability,
    };

    // Cache the result
    if (redis) {
      await redis.setex(cacheKey, TTL.PRESENCE, JSON.stringify(presenceData));
    }

    return NextResponse.json({ ok: true, data: presenceData });
  } catch (error: any) {
    // Handle 403 (no permission) or 404 (user not found) gracefully
    if (error.statusCode === 403 || error.statusCode === 404) {
      return NextResponse.json({ ok: false, data: null }, { status: 200 });
    }

    console.error('Failed to fetch presence:', error);
    return NextResponse.json({ ok: false, data: null }, { status: 200 });
  }
}
