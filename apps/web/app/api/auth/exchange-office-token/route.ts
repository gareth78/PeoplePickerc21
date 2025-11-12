export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { validateOfficeToken } from '@/lib/auth/microsoft';
import { generateJWT } from '@/lib/auth/jwt';
import { searchUserByEmail } from '@/lib/okta';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/exchange-office-token
 * Exchange Office 365 SSO token for our JWT
 * Used by Outlook add-in
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { officeToken } = body;

    if (!officeToken) {
      return NextResponse.json(
        { error: 'Office token required' },
        { status: 400 }
      );
    }

    // Validate Office token with Microsoft
    let email: string;
    let microsoftAccessToken: string | undefined;
    try {
      const tokenData = await validateOfficeToken(officeToken);
      email = tokenData.email;
      // Store the Office token for delegated Graph API calls
      microsoftAccessToken = officeToken;
    } catch (error) {
      console.error('Office token validation failed:', error);

      await createAuditLog({
        action: 'AUTH_FAILED',
        adminEmail: 'anonymous',
        metadata: {
          reason: 'Invalid Office token',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        { error: 'Invalid Office token' },
        { status: 401 }
      );
    }

    // Check if user exists in Okta directory
    try {
      const oktaUser = await searchUserByEmail(email);

      if (!oktaUser) {
        console.error('User not found in Okta directory:', email);

        await createAuditLog({
          action: 'AUTH_FAILED',
          adminEmail: email,
          metadata: {
            reason: 'User not found in Okta directory',
          },
        });

        return NextResponse.json(
          { error: 'User not found in directory' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Okta user lookup failed:', error);

      await createAuditLog({
        action: 'AUTH_FAILED',
        adminEmail: email,
        metadata: {
          reason: 'Okta lookup failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return NextResponse.json(
        { error: 'Directory lookup failed' },
        { status: 500 }
      );
    }

    // Check if user is an admin
    let isAdmin = false;
    try {
      const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() },
      });
      isAdmin = !!admin;
    } catch (error) {
      console.error('Admin check failed:', error);
      // Continue with isAdmin = false
    }

    // Generate JWT with Microsoft access token
    const jwt = await generateJWT(email, isAdmin, microsoftAccessToken);

    // Create audit log
    await createAuditLog({
      action: 'AUTH_LOGIN',
      adminEmail: email,
      metadata: {
        method: 'office_sso',
        isAdmin,
      },
    });

    return NextResponse.json({
      jwt,
      email,
      isAdmin,
    });
  } catch (error) {
    console.error('Token exchange error:', error);

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
