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
      maxWait: 2000, // 2 seconds - wait longer for connection
      timeout: 5000, // 5 seconds - extended timeout
      isolationLevel: 'ReadCommitted', // Explicit isolation level
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

// Initialize connection for serverless cold starts
export async function warmupConnection() {
  try {
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection warmed up successfully');
    return true;
  } catch (error) {
    console.error('Database warmup failed:', error);
    // Try basic connection if query fails
    try {
      await prisma.$connect();
      return true;
    } catch (connError) {
      console.error('Database connection failed entirely:', connError);
      return false;
    }
  }
}

// Wrapper to handle prepared statement conflicts
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;
  
  // Ensure connection before starting
  try {
    await prisma.$connect();
  } catch (connError) {
    console.warn('Initial connection attempt failed:', connError);
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      // Check if it's a connection or prepared statement issue
      const errorObj = error as { code?: string; message?: string };
      const isConnectionError = errorObj?.message?.includes('Engine is not yet connected') || 
                               errorObj?.message?.includes('connection') ||
                               errorObj?.code === '42P05' || 
                               errorObj?.message?.includes('prepared statement');
      
      if (isConnectionError) {
        console.warn(`Database connection/statement issue on attempt ${attempt}, retrying...`);
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        
        // Try to reset connection
        try {
          await prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
          await prisma.$connect();
        } catch (connError) {
          console.warn('Connection reset failed:', connError);
        }
        
        continue;
      }
      
      // If it's not a connection/statement error, don't retry
      throw error;
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError;
}