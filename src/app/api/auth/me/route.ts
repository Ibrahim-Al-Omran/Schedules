import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = getAuthUser(req as any);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: authUser,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
