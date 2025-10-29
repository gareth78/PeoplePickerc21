import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/redis';

export async function GET() {
  try {
    const stats = await getCacheStats();

    return NextResponse.json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to get cache stats',
      },
      { status: 500 }
    );
  }
}
