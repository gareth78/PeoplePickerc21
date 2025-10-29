import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/redis';

export async function GET() {
  console.log('🔴 /api/cache/stats endpoint called!');

  try {
    const stats = await getCacheStats();
    console.log('🔴 Stats result:', stats);

    return NextResponse.json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    console.error('🔴 Stats endpoint error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to get cache stats',
      },
      { status: 500 }
    );
  }
}
