/**
 * API Route: /api/admin/config/okta/test
 * 
 * Tests Okta configuration by attempting a connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { testOktaConfig } from '@/lib/config';
import { getAdminFromRequest } from '@/lib/admin/middleware';

export const runtime = 'nodejs';

// POST - Test Okta configuration
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { orgUrl, apiToken } = body;

    // Validate inputs
    if (!orgUrl || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: orgUrl and apiToken' },
        { status: 400 }
      );
    }

    // Cannot test with masked token
    if (apiToken.includes('••••')) {
      return NextResponse.json(
        { error: 'Cannot test with masked API token. Please provide the full token.' },
        { status: 400 }
      );
    }

    // Test connection
    const result = await testOktaConfig({ orgUrl, apiToken });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Error testing Okta config:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
