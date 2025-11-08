import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const version = process.env.NEXT_PUBLIC_GIT_SHA || 'dev';
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
    const oktaUrl = process.env['okta-org-url'];
    let oktaTenant = 'Not configured';

    if (oktaUrl) {
      try {
        oktaTenant = new URL(oktaUrl).hostname;
      } catch {
        oktaTenant = oktaUrl;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        status: 200,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        uptime: process.uptime(),
        version,
        buildTime,
        oktaTenant,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
