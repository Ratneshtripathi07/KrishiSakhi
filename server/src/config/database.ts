// server/src/config/database.ts
// Prisma client initialization with lifecycle helpers.

import { PrismaClient } from '@prisma/client';
import { env } from './environment';

// Avoid multiple Prisma instances in dev with hot-reload
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = global as any as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
