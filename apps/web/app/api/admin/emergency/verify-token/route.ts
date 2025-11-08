import { NextRequest, NextResponse } from 'next/server';
import { verifyEmergencyToken } from '@/lib/admin/auth';
import { createAuditLog } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      await createAuditLog({
        action: 'BREAK_GLASS_ACCESS',
        adminEmail: 'anonymous',
        metadata: { success: false, reason: 'No token provided' },
      });

      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const isValid = verifyEmergencyToken(token);

    if (!isValid) {
      await createAuditLog({
        action: 'BREAK_GLASS_ACCESS',
        adminEmail: 'anonymous',
        metadata: { success: false, reason: 'Invalid token' },
      });

      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await createAuditLog({
      action: 'BREAK_GLASS_ACCESS',
      adminEmail: 'anonymous',
      metadata: { success: true, stage: 'token_verified' },
    });

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error verifying emergency token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
