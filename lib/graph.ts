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

    // Convert binary to base64
    const buffer = Buffer.from(photo);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.log(`No photo found for ${email}`);
    return null;
  }
}
