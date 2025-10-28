import { NextResponse } from 'next/server';
import { searchUsers } from '@/lib/okta';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cursor = searchParams.get('cursor') || undefined;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const normalizedQuery = query.trim();
    const configuredLimit = Number(process.env['search-results-limit']);
    const limit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 100;
    const result = await searchUsers(normalizedQuery, limit, cursor);

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
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
