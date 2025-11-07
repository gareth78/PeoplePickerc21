// app/api/admin/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/auth';
import { getRecentActivity } from '@/lib/admin/stats';

export async function GET(request: NextRequest) {
  const authResult = await verifyAdminAuth(request);
  if (!authResult.authenticated || !authResult.session) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const logs = await getRecentActivity(limit);
    
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
