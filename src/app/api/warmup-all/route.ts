import { NextResponse } from 'next/server';

// Use edge runtime for instant response
export const runtime = 'edge';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Ping multiple critical endpoints to warm them up
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const endpoints = [
      '/api/warmup',      // Database warmup
      '/api/health',      // Health check
    ];
    
    // Warm up endpoints in parallel
    const warmupPromises = endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'Vercel-Warmup' }
        });
        return {
          endpoint,
          status: response.status,
          success: response.ok
        };
      } catch (error) {
        return {
          endpoint,
          status: 500,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(warmupPromises);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'Warmup completed',
      runtime: 'edge',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      results,
      environment: process.env.NODE_ENV,
      warmedEndpoints: results.filter(r => r.success).length,
      totalEndpoints: results.length
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'Warmup failed',
      runtime: 'edge',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
