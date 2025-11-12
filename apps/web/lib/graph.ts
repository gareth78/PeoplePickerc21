import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';
import type { GroupPermissionCheckResult } from '@/lib/types';

let graphClient: Client | null = null;
let credential: ClientSecretCredential | null = null;

export async function getGraphClient(): Promise<Client> {
  if (!graphClient) {
    // Initialize credential lazily to avoid build-time errors
    if (!credential) {
      const tenantId = process.env.ENTRA_TENANT_ID;
      const clientId = process.env.ENTRA_CLIENT_ID;
      const clientSecret = process.env.ENTRA_CLIENT_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Missing Microsoft Graph credentials in environment variables');
      }

      credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    }

    const authProvider = {
      getAccessToken: async () => {
        const token = await credential!.getToken('https://graph.microsoft.com/.default');
        if (!token || !token.token) {
          throw new Error('Failed to acquire access token from Azure');
        }
        return token.token;
      }
    };

    graphClient = Client.initWithMiddleware({
      authProvider
    });
  }
  return graphClient;
}

export async function getUserPhoto(email: string): Promise<string | null> {
  try {
    const client = await getGraphClient();
    const photo = await client
      .api(`/users/${email}/photo/$value`)
      .get();

    // Photo is returned as an ArrayBuffer or Blob
    // Convert to base64
    let buffer: Buffer;

    if (photo instanceof ArrayBuffer) {
      buffer = Buffer.from(photo);
    } else if (photo instanceof Blob) {
      // Convert Blob to ArrayBuffer first
      const arrayBuffer = await photo.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(photo)) {
      buffer = photo;
    } else {
      console.error('Unexpected photo type:', typeof photo);
      return null;
    }

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error: any) {
    // Only log if it's not a 404 (user has no photo)
    if (error.statusCode !== 404) {
      console.error(`Failed to fetch photo for ${email}:`, error.message);
    }
    return null;
  }
}

export async function getGroupPhoto(groupId: string): Promise<string | null> {
  try {
    const client = await getGraphClient();
    const photo = await client
      .api(`/groups/${groupId}/photo/$value`)
      .get();

    // Photo is returned as an ArrayBuffer or Blob
    // Convert to base64
    let buffer: Buffer;

    if (photo instanceof ArrayBuffer) {
      buffer = Buffer.from(photo);
    } else if (photo instanceof Blob) {
      // Convert Blob to ArrayBuffer first
      const arrayBuffer = await photo.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(photo)) {
      buffer = photo;
    } else {
      console.error('Unexpected photo type:', typeof photo);
      return null;
    }

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error: any) {
    // Only log if it's not a 404 (group has no photo)
    if (error.statusCode !== 404) {
      console.error(`Failed to fetch photo for group ${groupId}:`, error.message);
    }
    return null;
  }
}

export async function getGroupMemberCount(groupId: string): Promise<number | null> {
  try {
    const client = await getGraphClient();
    const rawCount = await client
      .api(`/groups/${groupId}/members/$count`)
      .header('ConsistencyLevel', 'eventual')
      .get();

    if (typeof rawCount === 'number') {
      return rawCount;
    }

    const parsed = parseInt(String(rawCount), 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch (error: any) {
    if (error.statusCode && error.statusCode !== 404) {
      console.error(`Failed to fetch member count for group ${groupId}:`, error.message);
    } else if (!error.statusCode) {
      console.error(`Failed to fetch member count for group ${groupId}:`, error.message ?? error);
    }
    return null;
  }
}

// Microsoft 365 Groups functions
export async function searchGroups(query: string): Promise<any> {
  try {
    const client = await getGraphClient();

    // Escape single quotes to keep the filter expression valid
    const sanitizedQuery = query.replace(/'/g, "''");

    // Search across all group types (Microsoft 365, security, distribution, dynamic, etc.)
    // Include member count with $count query parameter and ConsistencyLevel header
    // Note: $orderby is not used here because Microsoft Graph doesn't support sorting with filters
    // Results are sorted client-side instead (see route.ts)
    const result = await client
      .api('/groups')
      .header('ConsistencyLevel', 'eventual')
      .filter(`(startswith(displayName,'${sanitizedQuery}') or startswith(mail,'${sanitizedQuery}') or startswith(mailNickname,'${sanitizedQuery}'))`)
      .select('id,displayName,mail,description,groupTypes,createdDateTime,visibility,classification,mailEnabled,securityEnabled')
      .expand('members($count=true;$top=0)')
      .count(true)
      .top(50)
      .get();

    return result;
  } catch (error: any) {
    console.error('Failed to search groups:', error.message);
    throw error;
  }
}

export async function getGroupDetail(groupId: string): Promise<any> {
  try {
    const client = await getGraphClient();

    // Get group details
    const group = await client
      .api(`/groups/${groupId}`)
      .select('id,displayName,mail,description,groupTypes,createdDateTime,visibility,classification,mailEnabled,securityEnabled')
      .get();

    return group;
  } catch (error: any) {
    console.error(`Failed to fetch group ${groupId}:`, error.message);
    throw error;
  }
}

export async function getGroupMembers(groupId: string): Promise<any[]> {
  try {
    const client = await getGraphClient();

    // Get group members
    const result = await client
      .api(`/groups/${groupId}/members`)
      .select('id,displayName,mail,userPrincipalName,jobTitle,department')
      .top(100)
      .get();

    return result.value || [];
  } catch (error: any) {
    console.error(`Failed to fetch members for group ${groupId}:`, error.message);
    throw error;
  }
}

export async function getGroupOwners(groupId: string): Promise<any[]> {
  try {
    const client = await getGraphClient();

    // Get group owners
    const result = await client
      .api(`/groups/${groupId}/owners`)
      .select('id,displayName,mail,userPrincipalName,jobTitle,department')
      .top(100)
      .get();

    return result.value || [];
  } catch (error: any) {
    console.error(`Failed to fetch owners for group ${groupId}:`, error.message);
    throw error;
  }
}

// Check if user can send to a group
export async function checkGroupSendPermission(
  groupId: string,
  userEmail: string,
): Promise<GroupPermissionCheckResult> {
  try {
    const client = await getGraphClient();

    // Get group details including send permission fields
    const group = await client
      .api(`/groups/${groupId}`)
      .select(
        'id,displayName,mail,visibility,mailEnabled,securityEnabled,allowExternalSenders,requireSenderAuthenticationEnabled',
      )
      .get();

    const groupName = group.displayName || group.mail || 'Unknown Group';
    const groupDetails = {
      visibility: group.visibility,
      allowExternalSenders: group.allowExternalSenders,
      requireSenderAuthenticationEnabled: group.requireSenderAuthenticationEnabled,
      mailEnabled: group.mailEnabled,
      mail: group.mail ?? null,
    };

    if (group.mailEnabled === false || !group.mail) {
      return {
        canSend: false,
        reason: 'This group is not mail-enabled or does not have a delivery address.',
        membershipChecked: false,
        groupName,
        groupDetails,
      };
    }

    // Check if user is a member of the group
    let isMember = false;
    let membershipChecked = false;
    try {
      const sanitizedEmail = userEmail.replace(/'/g, "''");
      const members = await client
        .api(`/groups/${groupId}/members`)
        .select('id,mail,userPrincipalName')
        .filter(`mail eq '${sanitizedEmail}' or userPrincipalName eq '${sanitizedEmail}'`)
        .top(1)
        .get();

      membershipChecked = true;
      isMember = Array.isArray(members.value) && members.value.length > 0;
    } catch (memberError: any) {
      console.error('Error checking group membership:', memberError.message ?? memberError);
      // If we can't check membership, proceed with other checks but note it in response
    }

    // Determine if user can send based on group settings
    if (isMember) {
      return {
        canSend: true,
        reason: 'You are a member of this group',
        membershipChecked,
        groupName,
        groupDetails,
      };
    }

    // Check if group allows external senders
    if (group.allowExternalSenders === true) {
      return {
        canSend: true,
        reason: 'Group allows external senders',
        membershipChecked,
        groupName,
        groupDetails,
      };
    }

    // Check if sender authentication is not required
    if (group.requireSenderAuthenticationEnabled === false) {
      return {
        canSend: true,
        reason: 'Group does not require sender authentication',
        membershipChecked,
        groupName,
        groupDetails,
      };
    }

    // Default: user cannot send
    return {
      canSend: false,
      reason: membershipChecked
        ? 'You are not a member and the group restricts external senders'
        : 'Group restricts external senders and your membership could not be verified',
      membershipChecked,
      groupName,
      groupDetails,
    };
  } catch (error: any) {
    console.error(`Failed to check send permission for group ${groupId}:`, error.message);
    throw error;
  }
}
