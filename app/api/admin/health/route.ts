// app/api/admin/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/auth';
import { checkSystemHealth } from '@/lib/admin/stats';

export async function GET(request: NextRequest) {
  const authResult = await verifyAdminAuth(request);
  if (!authResult.authenticated || !authResult.session) {
    return authResult.response!;
  }

  try {
    const health = await checkSystemHealth();
    return NextResponse.json(health);
  } catch (error: any) {
    console.error('Health check API error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
