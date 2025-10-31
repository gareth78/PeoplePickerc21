import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

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

// Microsoft 365 Groups functions
export async function searchGroups(query: string): Promise<any> {
  try {
    const client = await getGraphClient();

    // Escape single quotes to keep the filter expression valid
    const sanitizedQuery = query.replace(/'/g, "''");

    // Search for M365 Groups and mail-enabled groups
    // Filter: Unified (M365) groups or mail-enabled groups
    // Include member count with $count query parameter and ConsistencyLevel header
    const result = await client
      .api('/groups')
      .header('ConsistencyLevel', 'eventual')
      .filter(`(groupTypes/any(c:c eq 'Unified') or mailEnabled eq true) and (startswith(displayName,'${sanitizedQuery}') or startswith(mail,'${sanitizedQuery}'))`)
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
