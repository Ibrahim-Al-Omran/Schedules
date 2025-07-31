import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test what models are available
console.log('Available models:', Object.keys(prisma));

export { prisma };
