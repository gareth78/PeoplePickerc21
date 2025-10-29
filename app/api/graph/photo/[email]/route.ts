import { NextResponse } from 'next/server';
import { getUserPhoto } from '@/lib/graph';
import { getRedisClient } from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const { email } = params;
    const cacheKey = `photo:${email}`;
    const redis = getRedisClient();

    // Check cache first (24h TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ photo: cached });
      }
    }

    // Fetch from Graph API
    const photo = await getUserPhoto(email);

    // Cache for 24 hours
    if (redis && photo) {
      await redis.setex(cacheKey, 86400, photo);
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Failed to fetch photo:', error);
    return NextResponse.json({ photo: null }, { status: 200 });
  }
}
