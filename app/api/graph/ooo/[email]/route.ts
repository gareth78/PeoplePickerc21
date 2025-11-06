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
    const cacheKey = `ooo:${normalizedEmail}`;
    const redis = getRedisClient();

    // Check cache first (30 minute TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ok: true, data: JSON.parse(cached) });
      }
    }

    // Fetch from Graph API
    const client = await getGraphClient();

    // Lookup user to get Object ID (more reliable than email)
    const user = await client
      .api(`/users/${normalizedEmail}`)
      .select('id')
      .get();

    // Use Object ID for mailbox settings call
    const mailboxSettings = await client
      .api(`/users/${user.id}/mailboxSettings`)
      .select('automaticRepliesSetting')
      .get();

    const automaticReplies = mailboxSettings.automaticRepliesSetting;

    // OOO is active when status is 'scheduled' or 'alwaysEnabled'
    const isOOO = automaticReplies.status === 'scheduled' || automaticReplies.status === 'alwaysEnabled';

    const oooData = {
      isOOO,
      message: isOOO ? (automaticReplies.internalReplyMessage || automaticReplies.externalReplyMessage || null) : null,
      startTime: automaticReplies.scheduledStartDateTime?.dateTime || null,
      endTime: automaticReplies.scheduledEndDateTime?.dateTime || null,
    };

    // Cache the result
    if (redis) {
      await redis.setex(cacheKey, TTL.OOO, JSON.stringify(oooData));
    }

    return NextResponse.json({ ok: true, data: oooData });
  } catch (error: any) {
    // Handle 403 (no permission) or 404 (user not found) gracefully
    if (error.statusCode === 403 || error.statusCode === 404) {
      return NextResponse.json({ ok: false, data: null }, { status: 200 });
    }

    console.error('Failed to fetch OOO status:', error);
    return NextResponse.json({ ok: false, data: null }, { status: 200 });
  }
}
