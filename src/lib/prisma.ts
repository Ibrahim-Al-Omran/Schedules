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

// Wrapper to handle prepared statement conflicts
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a prepared statement conflict
      if (error?.code === '42P05' || error?.message?.includes('prepared statement')) {
        console.warn(`Prepared statement conflict on attempt ${attempt}, retrying...`);
        
        // Brief delay before retry to allow statement cleanup
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        
        // Try to disconnect and reconnect to clear prepared statements
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (connError) {
          console.warn('Connection reset failed:', connError);
        }
        
        continue;
      }
      
      // If it's not a prepared statement error, don't retry
      throw error;
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError;
}