import { useState, useEffect } from 'react';
import { sdk } from '@people-picker/sdk';

interface AuthState {
  jwt: string | null;
  loading: boolean;
  error: string | null;
  userEmail: string | null;
}

const logDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log('[AUTH]', ...args);
  }
};

export function useAuth(): AuthState {
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function authenticate() {
      try {
        logDev('Starting Office SSO authentication...');

        // Check if Office context is available
        if (typeof Office === 'undefined' || !Office.context?.mailbox) {
          throw new Error('Office context not available');
        }

        // Check if SSO is available
        if (typeof Office.auth?.getAccessToken !== 'function') {
          throw new Error('Office SSO not available');
        }

        // Step 1: Get Office access token
        logDev('Requesting Office access token...');
        const officeToken = await Office.auth.getAccessToken({
          allowSignInPrompt: true,
          allowConsentPrompt: true,
          forMSGraphAccess: false
        });

        logDev('Office token obtained, exchanging for JWT...');

        // Step 2: Exchange for JWT
        const base = sdk.baseUrl || '';
        const response = await fetch(`${base}/api/auth/exchange-office-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ officeToken })
        });

        if (!response.ok) {
          let errorMessage = `Authentication failed: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If JSON parsing fails, use the default error message
          }
          logDev('Token exchange failed:', response.status, errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        logDev('JWT obtained successfully');

        setJwt(data.jwt);
        setUserEmail(data.email || null);
        setError(null);
      } catch (err: unknown) {
        logDev('Authentication error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setJwt(null);
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, []);

  return { jwt, loading, error, userEmail };
}
