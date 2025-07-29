import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    console.log('Database connected successfully');
    
    // Test simple query
    const { count, error: countError } = await supabaseAdmin
      .from('User')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`Found ${count} users in database`);
    
    return NextResponse.json({
      status: 'Database connection successful',
      userCount: count,
      timestamp: new Date().toISOString(),
      api: 'supabase-rest-api'
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
  }
}
