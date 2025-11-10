import 'server-only';

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

declare global {
  // eslint-disable-next-line no-var
  var __ADMIN_BOOTSTRAP_PROMISE__: Promise<void> | undefined;
}

const commitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  process.env.COMMIT_SHA ??
  'local-dev';

async function runBootstrap() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'database connectivity check failed';
    console.error(`[ADMIN] Bootstrap: connection check failed - ${message}`);
    return;
  }

  const rawEmail = process.env.INITIAL_ADMIN_EMAIL;
  const email = rawEmail?.trim().toLowerCase();

  if (!email) {
    console.log('[ADMIN] Bootstrap: skipped (no INITIAL_ADMIN_EMAIL)');
    return;
  }

  try {
    await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        id: randomUUID(),
        email,
        username: email.split('@')[0],
        createdBy: 'bootstrap',
      },
    });

    console.log('[ADMIN] Bootstrap: added/verified', email);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'unknown error during bootstrap';
    console.error(`[ADMIN] Bootstrap: failed - ${message}`);
  }
}

if (!globalThis.__ADMIN_BOOTSTRAP_PROMISE__) {
  console.log('[BOOT] Commit:', commitSha);
  globalThis.__ADMIN_BOOTSTRAP_PROMISE__ = runBootstrap();
}

void globalThis.__ADMIN_BOOTSTRAP_PROMISE__;
