import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getGoogleCalendarClient } from '@/lib/google';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request as any);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Google access token
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { googleAccessToken: true },
    });

    if (!user || !user.googleAccessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected.' }, { status: 400 });
    }

    const calendar = getGoogleCalendarClient(user.googleAccessToken);
    const { data } = await calendar.calendarList.list();

    if (!data.items) {
      return NextResponse.json({ error: 'No calendars found.' }, { status: 404 });
    }

    const calendars = data.items.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
    }));

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json({ error: 'Failed to fetch calendars.' }, { status: 500 });
  }
}
