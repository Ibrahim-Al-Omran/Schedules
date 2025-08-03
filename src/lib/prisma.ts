import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [], // Minimize logging in production
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Optimize for serverless environments with connection pooling
    transactionOptions: {
      maxWait: 1500, // 1.5 seconds - faster timeout for serverless
      timeout: 4000, // 4 seconds - reduced timeout
    },
  });

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Remove process termination handlers - let connection pooling handle cleanup
// Note: With connection pooling, manual disconnection can hurt performance

// Helper function to ensure connection is ready
export async function ensureDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}