import { NextRequest, NextResponse } from 'next/server';
import { checkGroupSendPermission } from '@/lib/graph';
import { requireAuth } from '@/lib/auth/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';
import type { CheckSendPermissionRequest, CheckSendPermissionResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Require JWT authentication
    const authResult = await requireAuth(request);
    if (!authResult.authorized) {
      return authResult.response;
    }
    const user = authResult.user;

    // Parse request body
    const body: CheckSendPermissionRequest = await request.json();
    const { groupId, userEmail } = body;

    // Validate required fields
    if (!groupId || !userEmail) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Missing required fields: groupId and userEmail',
        } as CheckSendPermissionResponse,
        { status: 400 }
      );
    }

    // Validate groupId format (basic GUID validation)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(groupId)) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Invalid group ID format',
        } as CheckSendPermissionResponse,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Invalid email format',
        } as CheckSendPermissionResponse,
        { status: 400 }
      );
    }

    // Extract domain from userEmail
    const emailDomain = userEmail.split('@')[1].toLowerCase();

    // Query domain routing from database
    const domain = await prisma.smtpDomain.findFirst({
      where: {
        domain: emailDomain,
      },
      include: {
        tenancy: {
          select: {
            id: true,
            name: true,
            tenantId: true,
            enableGroupSendCheck: true,
          },
        },
      },
    });

    // If domain not found, check if feature is enabled globally
    // For now, we'll require domain configuration
    if (!domain) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Domain not configured in system. Contact IT to enable permission checking for your domain.',
        } as CheckSendPermissionResponse,
        { status: 200 }
      );
    }

    // Check feature flag: domain-level overrides tenancy-level
    const featureEnabled = domain.enableGroupSendCheck ?? domain.tenancy.enableGroupSendCheck;

    if (!featureEnabled) {
      // Log the check attempt even if feature is disabled
      await createAuditLog({
        action: 'CHECK_GROUP_SEND_PERMISSION',
        adminEmail: user!.email,
        targetEmail: userEmail,
        metadata: {
          groupId,
          featureEnabled: false,
          domain: emailDomain,
          tenancyId: domain.tenancy.id,
          tenancyName: domain.tenancy.name,
        },
      });

      return NextResponse.json(
        {
          available: false,
          reason: 'Permission checking is not enabled for your domain',
        } as CheckSendPermissionResponse,
        { status: 200 }
      );
    }

    // Feature is enabled, perform the permission check
    try {
      const result = await checkGroupSendPermission(groupId, userEmail);

      // Log the successful check
      await createAuditLog({
        action: 'CHECK_GROUP_SEND_PERMISSION',
        adminEmail: user!.email,
        targetEmail: userEmail,
        metadata: {
          groupId,
          groupName: result.groupName,
          canSend: result.canSend,
          reason: result.reason,
          membershipChecked: result.membershipChecked,
          groupDetails: result.groupDetails,
          domain: emailDomain,
          tenancyId: domain.tenancy.id,
          tenancyName: domain.tenancy.name,
        },
      });

      return NextResponse.json(
        {
          available: true,
          canSend: result.canSend,
          reason: result.reason,
          groupName: result.groupName,
          membershipChecked: result.membershipChecked,
          groupDetails: result.groupDetails,
        } as CheckSendPermissionResponse,
        { status: 200 }
      );
    } catch (graphError: any) {
      // Log the error
      console.error('Graph API error during permission check:', graphError);

      await createAuditLog({
        action: 'CHECK_GROUP_SEND_PERMISSION',
        adminEmail: user!.email,
        targetEmail: userEmail,
        metadata: {
          groupId,
          error: graphError.message || 'Unknown Graph API error',
          domain: emailDomain,
          tenancyId: domain.tenancy.id,
          tenancyName: domain.tenancy.name,
        },
      });

      // Handle specific error cases
      if (graphError.statusCode === 404) {
        return NextResponse.json(
          {
            available: true,
            canSend: false,
            reason: 'Group not found or you do not have permission to view it',
            membershipChecked: false,
          } as CheckSendPermissionResponse,
          { status: 200 }
        );
      }

      if (graphError.statusCode === 403) {
        return NextResponse.json(
          {
            available: false,
            reason: 'Insufficient permissions to check group details. Contact IT for assistance.',
          } as CheckSendPermissionResponse,
          { status: 200 }
        );
      }

      // Generic error response
      return NextResponse.json(
        {
          available: false,
          reason: 'Unable to check permissions at this time. Please try again later.',
        } as CheckSendPermissionResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      {
        available: false,
        reason: 'An unexpected error occurred. Please try again later.',
      } as CheckSendPermissionResponse,
      { status: 500 }
    );
  }
}
