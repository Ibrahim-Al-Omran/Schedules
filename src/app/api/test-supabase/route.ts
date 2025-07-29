import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can query the User table
    const { data: users, error: usersError, count } = await supabaseAdmin
      .from('User')
      .select('id, email, name', { count: 'exact' })
      .limit(5);
    
    console.log('Query result:', { users, error: usersError, count });
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: usersError,
        message: 'Failed to query User table',
        troubleshooting: {
          error_code: usersError.code,
          error_message: usersError.message,
          hint: usersError.hint,
          details: usersError.details,
        }
      }, { status: 500 });
    }
    
    // Test 2: Try to query a specific email
    const { data: testUser, error: testError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', 'test@example.com')
      .single();
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working!',
      results: {
        totalUsersFound: count,
        sampleUsers: users?.map(u => ({ id: u.id, email: u.email, name: u.name })),
        testUserQuery: {
          found: !!testUser,
          error: testError?.message
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
