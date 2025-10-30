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

export async function getUserPresence(email: string): Promise<{
  availability: string;
  activity: string;
} | null> {
  try {
    const client = await getGraphClient();
    const presence = await client
      .api(`/users/${email}/presence`)
      .get();

    return {
      availability: presence.availability,
      activity: presence.activity
    };
  } catch (error: any) {
    console.error(`Failed to fetch presence for ${email}:`, error.message);
    return null;
  }
}
