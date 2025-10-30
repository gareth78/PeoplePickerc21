import { NextResponse } from 'next/server';
import { getUserPresence } from '@/lib/graph';
import { getRedisClient } from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const { email } = params;
    const cacheKey = `presence:${email}`;
    const redis = getRedisClient();

    // Check cache first (5 min TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached as string));
      }
    }

    // Fetch from Graph API
    const presence = await getUserPresence(email);

    // Cache for 5 minutes
    if (redis && presence) {
      await redis.setex(cacheKey, 300, JSON.stringify(presence));
    }

    return NextResponse.json({ presence });
  } catch (error) {
    console.error('Failed to fetch presence:', error);
    return NextResponse.json({ presence: null }, { status: 200 });
  }
}
