import { PrismaClient } from '@prisma/client';
import { readConfig } from './config';
async function main() {
  readConfig();
  const email = process.argv[2]?.toLowerCase();
  if (!email || !email.includes('@')) throw new Error('Pass an existing verified account email');
  const db = new PrismaClient();
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true },
    });
    if (!user?.emailVerifiedAt) throw new Error('Account not found or unverified');
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } }),
      db.auditEvent.create({
        data: { actorId: user.id, targetId: user.id, action: 'ADMIN_PROVISIONED_BY_OPERATOR' },
      }),
    ]);
    process.stdout.write('Admin role provisioned for verified account.\n');
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  process.stderr.write(String(error.message) + '\n');
  process.exitCode = 1;
});
