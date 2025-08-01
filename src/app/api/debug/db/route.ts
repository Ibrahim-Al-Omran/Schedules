import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Test simple query
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);
    
    // Test raw query to ensure database is accessible
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Raw query test:', result);
    
    return NextResponse.json({
      status: 'Database connection successful',
      userCount,
      rawQueryTest: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
