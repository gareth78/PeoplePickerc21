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
