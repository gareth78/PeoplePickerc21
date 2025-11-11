import { NextRequest, NextResponse } from 'next/server';
import { getUserPhoto } from '@/lib/graph';
import { getRedisClient, TTL } from '@/lib/redis';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  // Require JWT authentication
  const authResult = await requireAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }
  const user = authResult.user;
  try {
    const rawEmail = decodeURIComponent(params.email);
    // Normalize email for consistent cache keys
    const normalizedEmail = rawEmail.toLowerCase().trim();
    const cacheKey = `photo:${normalizedEmail}`;
    const redis = getRedisClient();

    // Check cache first (24h TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ photo: cached });
      }
    }

    // Fetch from Graph API
    const photo = await getUserPhoto(normalizedEmail);

    // Cache using shared TTL constant
    if (redis && photo) {
      await redis.setex(cacheKey, TTL.PHOTO, photo);
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Failed to fetch photo:', error);
    return NextResponse.json({ photo: null }, { status: 200 });
  }
}
