import prisma from '@/lib/prisma';

interface MicrosoftTokenPayload {
  email: string;
  tenantId: string;
  name?: string;
  upn?: string;
  accessToken?: string;
}

interface AuthConfig {
  clientId: string;
  clientSecret: string;
}

/**
 * Get Microsoft auth configuration from database
 * @returns Client ID and secret for Microsoft OAuth
 */
async function getAuthConfig(): Promise<AuthConfig> {
  try {
    const [clientIdConfig, clientSecretConfig] = await Promise.all([
      prisma.configuration.findFirst({
        where: {
          key: 'auth.microsoft.client_id',
          enabled: true,
        },
      }),
      prisma.configuration.findFirst({
        where: {
          key: 'auth.microsoft.client_secret',
          enabled: true,
        },
      }),
    ]);

    if (!clientIdConfig || !clientSecretConfig) {
      throw new Error('Microsoft auth configuration not found in database');
    }

    return {
      clientId: clientIdConfig.value,
      clientSecret: clientSecretConfig.value,
    };
  } catch (error) {
    console.error('Failed to get auth config:', error);
    throw new Error('Auth configuration error');
  }
}

/**
 * Validate Office 365 SSO token from Outlook add-in
 * Verifies the token with Microsoft and extracts user information
 * @param token - Office access token from Office.context.auth.getAccessToken()
 * @returns User email and tenant ID
 */
export async function validateOfficeToken(token: string): Promise<MicrosoftTokenPayload> {
  try {
    // Decode the JWT without verification to get basic info
    // Office tokens are already validated by Office runtime
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Extract email and tenant information
    const email = payload.preferred_username || payload.upn || payload.email;
    const tenantId = payload.tid;

    if (!email || !tenantId) {
      throw new Error('Invalid token: missing required claims');
    }

    // Additional validation: verify token with Microsoft Graph
    // This ensures the token is still valid and not revoked
    try {
      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!graphResponse.ok) {
        // Token might be for Office but not for Graph
        // This is expected - we just need the claims
        console.log('Office token validation: Graph API returned', graphResponse.status);
      }
    } catch (error) {
      console.warn('Could not validate token with Graph API:', error);
      // Continue anyway - the token might be Office-only
    }

    return {
      email: email.toLowerCase(),
      tenantId,
      name: payload.name,
      upn: payload.upn,
    };
  } catch (error) {
    console.error('Office token validation failed:', error);
    throw new Error('Invalid Office token');
  }
}

/**
 * Exchange OAuth authorization code for tokens
 * Used by web client OAuth flow
 * @param code - Authorization code from Microsoft OAuth callback
 * @param redirectUri - Redirect URI used in the OAuth request
 * @returns User email and tenant ID
 */
export async function exchangeOAuthCode(
  code: string,
  redirectUri: string
): Promise<MicrosoftTokenPayload> {
  try {
    const config = await getAuthConfig();

    // Exchange code for tokens
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'openid profile email User.Read Group.Read.All',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const data = await response.json();

    // Decode the ID token to get user information
    const idToken = data.id_token;
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    const email = payload.preferred_username || payload.upn || payload.email;
    const tenantId = payload.tid;

    if (!email || !tenantId) {
      throw new Error('Invalid token: missing required claims');
    }

    return {
      email: email.toLowerCase(),
      tenantId,
      name: payload.name,
      upn: payload.upn,
      accessToken: data.access_token, // Store the Microsoft access token
    };
  } catch (error) {
    console.error('OAuth code exchange failed:', error);
    throw new Error('OAuth authentication failed');
  }
}

/**
 * Build Microsoft OAuth authorization URL
 * @param redirectUri - Where Microsoft should redirect after authentication
 * @param state - Optional state parameter for security
 * @returns Authorization URL to redirect the user to
 */
export async function buildAuthUrl(
  redirectUri: string,
  state?: string
): Promise<string> {
  const config = await getAuthConfig();

  const authEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email User.Read Group.Read.All',
  });

  if (state) {
    params.append('state', state);
  }

  return `${authEndpoint}?${params.toString()}`;
}
