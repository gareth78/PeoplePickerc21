import { NextRequest, NextResponse } from 'next/server';
import { checkGroupSendPermission } from '@/lib/graph';
import { requireAuth } from '@/lib/auth/middleware';
import { createAuditLog } from '@/lib/admin/audit';
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

    // Extract user email from JWT
    const userEmail = user!.email;

    // Extract domain for audit metadata (no database lookup)
    const emailDomain = userEmail.split('@')[1]?.toLowerCase() || 'unknown';

    // Parse request body
    const body: CheckSendPermissionRequest = await request.json();
    const { groupId } = body;

    // Validate required fields
    if (!groupId) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Missing required field: groupId',
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

    // Perform the permission check using email from JWT
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
          domain: emailDomain,
          error: graphError.message || 'Unknown Graph API error',
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
