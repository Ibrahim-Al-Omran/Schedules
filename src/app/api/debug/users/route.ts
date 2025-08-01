import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing user queries...');
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Get all users (but limit sensitive data)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // Don't include password for security
      },
      take: 10 // Limit to first 10 users
    });
    
    console.log(`Found ${users.length} users`);
    
    // Test specific email search (using a common test pattern)
    const testEmail = 'test@example.com'; // You can change this
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    return NextResponse.json({
      status: 'Success',
      totalUsers: users.length,
      users: users,
      testEmailSearch: {
        email: testEmail,
        found: !!testUser,
        user: testUser
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseConnected: true
    });
  } catch (error) {
    console.error('User query error:', error);
    
    return NextResponse.json(
      { 
        error: 'User query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
        environment: process.env.NODE_ENV,
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
