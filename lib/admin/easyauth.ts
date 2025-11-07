import { Buffer } from 'buffer';

export function getEmailFromEasyAuth(req: Request): string | null {
  const raw = req.headers.get('x-ms-client-principal');
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64').toString('utf8');
    const p = JSON.parse(json) as { claims: { typ: string; val: string }[] };
    const pick = (s: string) => p.claims.find(c => c.typ.endsWith(s))?.val;
    return (pick('/emailaddress') ?? pick('/upn') ?? pick('/name') ?? '').trim() || null;
  } catch {
    return null;
  }
}
