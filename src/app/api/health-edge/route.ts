import { NextResponse } from 'next/server';

// Use edge runtime for lightweight health check
export const runtime = 'edge';

export async function GET() {
  try {
    const startTime = Date.now();
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      status: 'healthy',
      runtime: 'edge',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      message: 'Edge runtime health check - instant response'
    });
  } catch (error) {
    console.error('Edge health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        runtime: 'edge',
        error: 'Edge health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
