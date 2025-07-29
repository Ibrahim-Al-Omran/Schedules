import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Testing user queries...');
    
    console.log('Database connected successfully');
    
    // Get all users (but limit sensitive data)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('User')
      .select('id, name, email, createdAt, updatedAt')
      .limit(10);
    
    if (usersError) throw usersError;
    
    console.log(`Found ${users?.length || 0} users`);
    
    // Test specific email search (using a common test pattern)
    const testEmail = 'test@example.com'; // You can change this
    const { data: testUser, error: testError } = await supabaseAdmin
      .from('User')
      .select('id, name, email')
      .eq('email', testEmail)
      .single();
    
    if (testError && testError.code !== 'PGRST116') throw testError;
    
    return NextResponse.json({
      status: 'Success',
      totalUsers: users?.length || 0,
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
  }
}
