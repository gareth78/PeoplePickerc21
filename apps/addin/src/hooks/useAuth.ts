import { useState, useEffect } from 'react';
import { sdk } from '@people-picker/sdk';

interface AuthState {
  jwt: string | null;
  loading: boolean;
  error: string | null;
  userEmail: string | null;
}

export function useAuth(): AuthState {
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function authenticate() {
      try {
        console.log('[AUTH] Starting authentication...');

        // CRITICAL: Wait for Office to be fully initialized
        console.log('[AUTH] Waiting for Office.onReady()...');
        await Office.onReady();
        console.log('[AUTH] Office.onReady() complete');

        // Check if Office context is available
        if (typeof Office === 'undefined' || !Office.context?.mailbox) {
          console.error('[AUTH] Office context not available after onReady');
          throw new Error('Office context not available');
        }

        console.log('[AUTH] Office context confirmed');

        // Check if SSO is available
        if (typeof Office.auth?.getAccessToken !== 'function') {
          console.error('[AUTH] Office SSO not available');
          throw new Error('Office SSO not available');
        }

        // Step 1: Get Office access token
        console.log('[AUTH] Requesting Office access token...');
        const officeToken = await Office.auth.getAccessToken({
          allowSignInPrompt: true,
          allowConsentPrompt: true,
          forMSGraphAccess: false
        });

        console.log('[AUTH] Office token obtained, length:', officeToken.length);

        // Step 2: Exchange for JWT
        const base = sdk.baseUrl || '';
        console.log('[AUTH] Exchanging token at:', `${base}/api/auth/exchange-office-token`);

        const response = await fetch(`${base}/api/auth/exchange-office-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ officeToken })
        });

        console.log('[AUTH] Exchange response status:', response.status);

        if (!response.ok) {
          let errorMessage = `Authentication failed: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('[AUTH] Error data:', errorData);
          } catch {
            console.error('[AUTH] Could not parse error response');
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[AUTH] JWT obtained successfully, user:', data.email);

        setJwt(data.jwt);
        setUserEmail(data.email || null);
        setError(null);
      } catch (err: unknown) {
        console.error('[AUTH] Authentication error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setJwt(null);
      } finally {
        setLoading(false);
        console.log('[AUTH] Authentication complete');
      }
    }

    authenticate();
  }, []);

  return { jwt, loading, error, userEmail };
}
