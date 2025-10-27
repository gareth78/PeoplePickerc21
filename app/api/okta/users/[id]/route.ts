import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/okta';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserById(params.id);

    return NextResponse.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'User not found',
      },
      { status: 404 }
    );
  }
}
