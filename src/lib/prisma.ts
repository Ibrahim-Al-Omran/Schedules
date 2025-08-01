import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientInitializationError, PrismaClientRustPanicError } from '@prisma/client/runtime';

const Prisma = PrismaClient.prototype;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

prisma.$on('error', (e: unknown) => {
  console.error('Prisma error:', e);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;