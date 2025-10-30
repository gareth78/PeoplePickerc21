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

    // Request photo - Graph client returns ArrayBuffer by default for $value endpoints
    const photo = await client
      .api(`/users/${email}/photo/$value`)
      .get();

    // Safely convert to base64
    if (!photo) {
      console.log(`No photo data returned for ${email}`);
      return null;
    }

    // Handle both ArrayBuffer and Buffer responses
    let buffer: Buffer;
    if (photo instanceof ArrayBuffer) {
      buffer = Buffer.from(photo);
    } else if (Buffer.isBuffer(photo)) {
      buffer = photo;
    } else {
      // Fallback: try to convert whatever we got
      buffer = Buffer.from(photo);
    }

    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error: any) {
    // 404 is expected when user has no photo
    if (error.statusCode === 404 || error.code === 'ImageNotFound') {
      console.log(`No photo found for ${email}`);
      return null;
    }
    // Log unexpected errors for debugging
    console.error(`Failed to fetch photo for ${email}:`, error.message || error);
    return null;
  }
}
