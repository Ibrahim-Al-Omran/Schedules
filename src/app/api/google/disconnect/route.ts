import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';

// Configure as dynamic since it uses authentication (cookies)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear Google Calendar connection for the user
    await adminDb.users.update(authUser.userId, {
      googleAccessToken: null,
      googleRefreshToken: null,
    });

    return NextResponse.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
}
