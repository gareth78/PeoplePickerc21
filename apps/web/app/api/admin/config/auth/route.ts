/**
 * API Route: /api/admin/config/auth
 *
 * Manages authentication configuration for multi-tenant Azure App Registration
 * This is the universal authentication app used for login flows (web client + add-in)
 * Separate from tenant-specific Graph API configurations in office_tenancies
 *
 * - GET: Retrieve current auth config (with masked client secret)
 * - PUT: Save new auth config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, updateAuthConfig } from '@/lib/config';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';

export const runtime = 'nodejs';

// GET - Retrieve authentication configuration (with masked client secret)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    // Get config
    const config = await getAuthConfig();

    // Mask client secret (show last 4 chars only)
    const maskedSecret = config.clientSecret
      ? '****' + config.clientSecret.slice(-4)
      : '';

    // Create audit log
    await createAuditLog({
      action: 'VIEW_AUTH_CONFIG',
      adminEmail: admin.email,
    });

    return NextResponse.json({
      clientId: config.clientId,
      clientSecret: maskedSecret,
      tenantId: config.tenantId,
    });

  } catch (error) {
    console.error('[API] Error fetching auth config:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch authentication configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update authentication configuration
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    // Parse request body
    const body = await request.json();
    const { clientId, clientSecret, tenantId } = body;

    // Validate inputs
    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json(
        { error: 'All fields are required: clientId, clientSecret, tenantId' },
        { status: 400 }
      );
    }

    // UUID validation for client ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      return NextResponse.json(
        { error: 'Client ID must be a valid UUID' },
        { status: 400 }
      );
    }

    // Don't save if secret is masked
    if (clientSecret.startsWith('****')) {
      return NextResponse.json(
        { error: 'Cannot save masked client secret. Please provide the full secret.' },
        { status: 400 }
      );
    }

    // Update configuration
    await updateAuthConfig(clientId, clientSecret, tenantId, admin.email);

    // Create audit log
    await createAuditLog({
      action: 'UPDATE_AUTH_CONFIG',
      adminEmail: admin.email,
      metadata: {
        clientId,
        tenantId,
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication configuration saved successfully',
    });

  } catch (error) {
    console.error('[API] Error updating auth config:', error);
    return NextResponse.json(
      {
        error: 'Failed to save authentication configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
