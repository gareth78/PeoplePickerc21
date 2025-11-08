import { NextResponse } from 'next/server';
import { searchUsers } from '@/lib/okta';

export async function GET() {
  try {
    const result = await searchUsers('', 5);

    return NextResponse.json({
      ok: true,
      data: result,
      meta: {
        count: result.users.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sample',
      },
      { status: 500 }
    );
  }
}
