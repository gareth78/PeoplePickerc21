function b64ToUtf8(input: string): string {
  // Works on Node and Edge without globals
  try {
    if (typeof atob === 'function') {
      // Browser/edge: atob expects non-URL-safe base64
      const bin = atob(input);
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
  } catch {}
  // Node path
  try {
    const { Buffer } = require('buffer');
    return Buffer.from(input, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export function getEmailFromEasyAuth(req: Request): string | null {
  const raw = req.headers.get('x-ms-client-principal');
  if (!raw) return null;
  try {
    const json = b64ToUtf8(raw);
    const p = JSON.parse(json) as { claims: { typ: string; val: string }[] };
    const pick = (s: string) => p.claims.find(c => c.typ.endsWith(s))?.val?.trim();
    return pick('/emailaddress') ?? pick('/upn') ?? pick('/name') ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract email from Bearer token (Office.js SSO token)
 * Returns the email address from the token's preferred_username or upn claim
 */
export function getEmailFromBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // JWT uses base64url encoding, which needs to be converted to regular base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = b64ToUtf8(base64);
    const claims = JSON.parse(json) as {
      preferred_username?: string;
      upn?: string;
      email?: string;
      unique_name?: string;
    };

    // Return the email from various possible claims
    return claims.preferred_username ?? claims.upn ?? claims.email ?? claims.unique_name ?? null;
  } catch (error) {
    // Token parsing failed
    return null;
  }
}
