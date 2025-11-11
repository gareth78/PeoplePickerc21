/**
 * API Route: /api/admin/config/auth/test
 *
 * Tests authentication configuration by fetching Microsoft signing keys
 * This verifies the tenant ID is valid and accessible
 *
 * - POST: Test connection to Microsoft identity platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';

export const runtime = 'nodejs';

// POST - Test authentication configuration
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    // Parse request body
    const body = await request.json();
    const { clientId, tenantId } = body;

    // Validate inputs
    if (!clientId || !tenantId) {
      return NextResponse.json(
        { error: 'clientId and tenantId are required for testing' },
        { status: 400 }
      );
    }

    // Test by fetching Microsoft signing keys
    const keysUrl = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;

    const response = await fetch(keysUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.keys || data.keys.length === 0) {
      throw new Error('No signing keys found for tenant');
    }

    // Create audit log for successful test
    await createAuditLog({
      action: 'TEST_AUTH_CONFIG',
      adminEmail: admin.email,
      metadata: {
        clientId,
        tenantId,
        success: true,
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration is valid. Successfully connected to Microsoft identity platform.',
      details: {
        keysFound: data.keys.length,
        tenantId: tenantId
      }
    });

  } catch (error: any) {
    // Create audit log for failed test
    const authResult = await verifyAdminAuth(request);
    if (authResult.authenticated && authResult.session) {
      const body = await request.json().catch(() => ({}));
      await createAuditLog({
        action: 'TEST_AUTH_CONFIG',
        adminEmail: authResult.session.email,
        metadata: {
          clientId: body.clientId,
          tenantId: body.tenantId,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
      });
    }

    console.error('[API] Error testing auth config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
        details: 'Unable to connect to Microsoft identity platform. Please verify the tenant ID is correct.'
      },
      { status: 400 }
    );
  }
}
