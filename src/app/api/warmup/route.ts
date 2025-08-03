import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple query to keep connection warm
    await prisma.$queryRaw`SELECT 1 as warmup`;
    
    return NextResponse.json({ 
      status: 'Database warmed up',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database warmup failed:', error);
    return NextResponse.json(
      { error: 'Database warmup failed' },
      { status: 500 }
    );
  }
}
