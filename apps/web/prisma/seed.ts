import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function ensureInitialAdmin() {
  const rawEmail = process.env.INITIAL_ADMIN_EMAIL;
  if (!rawEmail) {
    console.log('[ADMIN] Seed: skipped (no INITIAL_ADMIN_EMAIL)');
    return;
  }

  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    console.log('[ADMIN] Seed: skipped (blank INITIAL_ADMIN_EMAIL)');
    return;
  }

  const username = email.split('@')[0];

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      id: randomUUID(),
      email,
      username,
      createdBy: 'bootstrap-seed',
    },
  });

  console.log('[ADMIN] Seed: ensured initial admin', email);
}

async function main() {
  await ensureInitialAdmin();
}

main()
  .catch((error) => {
    console.error('[ADMIN] Seed: failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
