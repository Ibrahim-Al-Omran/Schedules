import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getGoogleCalendarClient } from '@/lib/google';
import { adminDb } from '@/lib/supabase-admin';

// Configure as dynamic since it uses authentication (cookies)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Google access token
    const user = await adminDb.users.findById(authUser.userId);

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      return NextResponse.json({ error: 'Google Calendar not connected.' }, { status: 400 });
    }

    // Create calendar client with token refresh callback
    const calendar = getGoogleCalendarClient(
      user.googleAccessToken, 
      user.googleRefreshToken,
      async (tokens) => {
        // Save refreshed tokens to database
        if (tokens.access_token) {
          try {
            await adminDb.users.update(authUser.userId, {
              googleAccessToken: tokens.access_token,
              ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token })
            });
            console.log('Updated tokens in database for user:', authUser.userId);
          } catch (error) {
            console.error('Failed to save refreshed tokens:', error);
          }
        }
      }
    );
    
    const { data } = await calendar.calendarList.list();

    if (!data.items) {
      return NextResponse.json({ error: 'No calendars found.' }, { status: 404 });
    }

    const calendars = data.items.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
    }));

    return NextResponse.json({ calendars });
  } catch (error: unknown) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendars.', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
