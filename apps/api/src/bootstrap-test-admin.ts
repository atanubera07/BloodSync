import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { hashPassword } from './password';

const email = 'bloodsync.app@gmail.com';
const db = new PrismaClient();

async function main() {
  // Only the mailbox owner can set a usable password through the reset flow.
  const passwordHash = await hashPassword(randomBytes(32).toString('base64url'));
  await db.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      create: {
        email,
        fullName: 'BloodSync Test Admin',
        passwordHash,
        role: 'ADMIN',
        emailVerifiedAt: new Date(),
      },
      update: {
        passwordHash,
        role: 'ADMIN',
        emailVerifiedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true },
    });
    await tx.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.emailToken.deleteMany({ where: { userId: user.id } });
    await tx.auditEvent.create({
      data: { actorId: user.id, targetId: user.id, action: 'TEST_ADMIN_PROVISIONED_BY_OPERATOR' },
    });
  });
  process.stdout.write('Test admin provisioned; password reset required.\n');
}

main()
  .catch((error) => {
    process.stderr.write(String(error.message) + '\n');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
