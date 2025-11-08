import { NextResponse } from 'next/server';
import { getConfigValue } from '@/lib/config';

export const runtime = 'nodejs';

const sanitizeUrl = (url: string | null | undefined): string | null => {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const resolveString = async (dbKey: string, fallback: string | null) => {
  try {
    const value = await getConfigValue(dbKey);
    if (value && value.trim().length > 0) {
      return value;
    }
  } catch (error) {
    console.warn(`[config] Failed to resolve ${dbKey}`, error);
  }

  return fallback;
};

export async function GET() {
  const appName =
    (await resolveString('app_name', process.env.NEXT_PUBLIC_APP_NAME ?? process.env.APP_NAME ?? null)) ??
    'People Picker';

  const orgName =
    (await resolveString('org_name', process.env.ORG_NAME ?? process.env.NEXT_PUBLIC_ORG_NAME ?? null)) ??
    'Plan International';

  const logoUrl = sanitizeUrl(
    await resolveString('org_logo_url', process.env.ORG_LOGO_URL ?? process.env.NEXT_PUBLIC_ORG_LOGO_URL ?? null),
  );

  const featureFlags = {
    presenceAutoRefresh: true,
    insertCompose: true,
    recipients: true,
  };

  return NextResponse.json({
    appName,
    orgName,
    orgLogoUrl: logoUrl,
    featureFlags,
  });
}
