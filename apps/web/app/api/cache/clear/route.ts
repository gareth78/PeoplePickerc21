import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  try {
    const client = getRedisClient();

    if (!client) {
      return NextResponse.json(
        { error: 'Redis not configured' },
        { status: 503 }
      );
    }

    // Get current stats before clearing
    const beforeKeys = await client.dbsize();

    // Clear all keys
    await client.flushdb();

    // Get stats after clearing
    const afterKeys = await client.dbsize();

    return NextResponse.json({
      success: true,
      keysCleared: beforeKeys,
      keysRemaining: afterKeys,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
