import { NextResponse } from 'next/server';

const DEFAULT_APP_NAME = 'People Picker';
const DEFAULT_ORG_NAME = 'Plan International';

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return !['false', '0', 'no'].includes(value.toLowerCase());
}

export async function GET() {
  const env = process.env;
  const appName = env.NEXT_PUBLIC_APP_NAME ?? env.PUBLIC_APP_NAME ?? DEFAULT_APP_NAME;
  const orgName = env.PUBLIC_ORG_NAME ?? DEFAULT_ORG_NAME;
  const orgLogoUrl = env.PUBLIC_ORG_LOGO_URL ?? null;

  const featureFlags = {
    enableInsert: toBool(env.ADDIN_INSERT_ENABLED, true),
    enablePresencePolling: toBool(env.ADDIN_PRESENCE_POLLING, true)
  } as const;

  return NextResponse.json({
    appName,
    orgName,
    orgLogoUrl,
    featureFlags,
    status: 'ok'
  });
}
