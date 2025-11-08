import { NextRequest, NextResponse } from 'next/server';
import {
  verifyEmergencyToken,
  verifyBreakGlassCredentials,
  setAdminSession,
} from '@/lib/admin/auth';
import { createAuditLog } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, token } = await request.json();

    // Verify the URL token first
    if (!token || !verifyEmergencyToken(token)) {
      await createAuditLog({
        action: 'BREAK_GLASS_LOGIN',
        adminEmail: email || 'anonymous',
        metadata: { success: false, reason: 'Invalid URL token' },
      });

      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    // Verify the credentials
    if (!email || !password) {
      await createAuditLog({
        action: 'BREAK_GLASS_LOGIN',
        adminEmail: email || 'anonymous',
        metadata: { success: false, reason: 'Missing credentials' },
      });

      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const isValid = verifyBreakGlassCredentials(email, password);

    if (!isValid) {
      await createAuditLog({
        action: 'FAILED_LOGIN',
        adminEmail: email,
        metadata: { type: 'break_glass', reason: 'Invalid credentials' },
      });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create emergency session (1 hour expiry)
    await setAdminSession(email, true);

    await createAuditLog({
      action: 'BREAK_GLASS_LOGIN',
      adminEmail: email,
      metadata: { success: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Emergency access granted',
    });
  } catch (error) {
    console.error('Error during emergency login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
