/**
 * API Route: /api/admin/config/okta
 * 
 * Manages Okta configuration
 * - GET: Retrieve current Okta config
 * - POST: Save new Okta config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOktaConfig, saveOktaConfig } from '@/lib/config';
import { getAdminFromRequest } from '@/lib/admin/middleware';

export const runtime = 'nodejs';

// GET - Retrieve Okta configuration (with masked API token)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get config
    const config = await getOktaConfig();

    // Return config with masked token
    return NextResponse.json({
      orgUrl: config.orgUrl,
      apiToken: '••••••••' + config.apiToken.slice(-4), // Mask all but last 4 chars
      source: 'database', // TODO: detect if from env vars
    });

  } catch (error) {
    console.error('[API] Error fetching Okta config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Okta configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Save Okta configuration
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

    // Validate orgUrl format
    try {
      new URL(orgUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid orgUrl format' },
        { status: 400 }
      );
    }

    // Only save if token is not masked
    if (apiToken.includes('••••')) {
      return NextResponse.json(
        { error: 'Cannot save masked API token. Please provide the full token.' },
        { status: 400 }
      );
    }

    // Save configuration
    await saveOktaConfig(
      { orgUrl, apiToken },
      admin.email
    );

    return NextResponse.json({
      success: true,
      message: 'Okta configuration saved successfully',
    });

  } catch (error) {
    console.error('[API] Error saving Okta config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save Okta configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
