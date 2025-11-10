/**
 * API Route: /api/admin/tenancies/test
 * 
 * Tests Office 365 tenant configuration by attempting a connection to Microsoft Graph API
 * Does NOT save credentials to database - only validates them
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin/middleware';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export const runtime = 'nodejs';

/**
 * Test Microsoft Graph API connection with provided credentials
 */
async function testGraphConnection(
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate inputs
    if (!tenantId || !clientId || !clientSecret) {
      return {
        success: false,
        message: 'Missing required credentials',
      };
    }

    // Create credential
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

    // Try to get an access token
    let token;
    try {
      token = await credential.getToken('https://graph.microsoft.com/.default');
    } catch (error: any) {
      return {
        success: false,
        message: `Authentication failed: ${error.message || 'Invalid credentials'}`,
      };
    }

    if (!token || !token.token) {
      return {
        success: false,
        message: 'Failed to acquire access token from Azure',
      };
    }

    // Create a Graph client with the token
    const client = Client.init({
      authProvider: (done) => {
        done(null, token.token);
      },
    });

    // Test the connection by making a simple API call (get organization details)
    try {
      await client.api('/organization').select('id,displayName').get();

      return {
        success: true,
        message: 'Successfully connected to Microsoft Graph API',
      };
    } catch (error: any) {
      // Check for specific error codes
      if (error.statusCode === 403) {
        return {
          success: false,
          message: 'Authentication succeeded, but missing required permissions. Please ensure the app has Organization.Read.All or Directory.Read.All permissions.',
        };
      } else if (error.statusCode === 401) {
        return {
          success: false,
          message: 'Unauthorized: Invalid or expired credentials',
        };
      } else {
        return {
          success: false,
          message: `Graph API error: ${error.message || 'Unknown error'}`,
        };
      }
    }
  } catch (error) {
    console.error('[API] Error testing Graph connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// POST - Test Office 365 tenant configuration
export const POST = withAdminAuth(async (request: NextRequest, session) => {
  try {
    // Parse request body
    const body = await request.json();
    const { tenantId, clientId, clientSecret } = body;

    // Validate inputs
    if (!tenantId || !clientId || !clientSecret) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Missing required fields: tenantId, clientId, and clientSecret are required',
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid Tenant ID format (must be a UUID)',
        },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(clientId)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid Client ID format (must be a UUID)',
        },
        { status: 400 }
      );
    }

    // Cannot test with masked secret
    if (clientSecret.includes('••••')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Cannot test with masked Client Secret. Please provide the full secret.',
        },
        { status: 400 }
      );
    }

    // Test connection
    const result = await testGraphConnection(tenantId, clientId, clientSecret);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Error testing tenancy:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
