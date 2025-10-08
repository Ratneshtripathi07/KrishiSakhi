// server/src/database/seeds/admin_seed.ts
// Seed a default demo admin if not present.
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/environment';

async function main() {
  if (!env.ADMIN_DEMO_EMAIL) {
    console.log('[seed] ADMIN_DEMO_EMAIL not set; skipping admin seed');
    return;
  }
  const exists = await prisma.admin.findUnique({ where: { email: env.ADMIN_DEMO_EMAIL } });
  if (exists) {
    console.log('[seed] Admin already exists:', env.ADMIN_DEMO_EMAIL);
    return;
  }
  const password = env.ADMIN_DEMO_PASSWORD || 'ChangeMe!123';
  const password_hash = await bcrypt.hash(password, 10);
  await prisma.admin.create({ data: { email: env.ADMIN_DEMO_EMAIL, password_hash, name: 'Demo Officer', role: 'admin' } });
  console.log('[seed] Admin created:', env.ADMIN_DEMO_EMAIL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
