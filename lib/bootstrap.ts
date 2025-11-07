export async function bootstrapAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.warn('[ADMIN] Bootstrap skipped: no DATABASE_URL available');
    return;
  }

  if (!email) {
    console.warn('[ADMIN] Bootstrap skipped: no INITIAL_ADMIN_EMAIL provided');
    return;
  }

  try {
    const [{ prisma }, { randomUUID }] = await Promise.all([
      import('@/lib/prisma'),
      import('crypto'),
    ]);

    const username = email.split('@')[0] ?? email;

    const admin = await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        id: randomUUID(),
        email,
        username,
        createdBy: 'bootstrap',
      },
    });

    console.log('[ADMIN] Bootstrap verified/added:', admin.email);
  } catch (err) {
    console.error('[ADMIN] Bootstrap failed:', err);
  }
}
