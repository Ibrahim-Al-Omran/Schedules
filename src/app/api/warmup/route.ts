import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Use edge runtime when possible for instant response
export const maxDuration = 10;

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Optimized warmup - test connection with minimal query
    const result = await prisma.$queryRaw`SELECT 1 as warmup, NOW() as db_time`;
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      status: 'Database warmed up successfully',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      dbResult: result,
      runtime: 'nodejs'
    });
  } catch (error) {
    console.error('Database warmup failed:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Database warmup failed',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
