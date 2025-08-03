import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getGoogleCalendarClient, CalendarEvent } from '@/lib/google';
import { prisma } from '@/lib/prisma';

// Configure as dynamic since it uses authentication (cookies)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    console.log('Received request body:', body); // Debug log

    const calendarId = body.calendarId;

    if (!calendarId) {
      return NextResponse.json(
        { error: 'Calendar ID is required.' },
        { status: 400 }
      );
    }

    // Get user's Google access token using Prisma ORM
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
      }
    });

    if (!user || !user.googleAccessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect your Google account first.' },
        { status: 400 }
      );
    }

    // Get user's shifts that haven't been uploaded yet using Prisma ORM
    const shifts = await prisma.shift.findMany({
      where: {
        userId: authUser.userId,
        uploaded: false,
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        coworkers: true,
        notes: true,
        uploaded: true,
      },
      orderBy: { date: 'asc' }
    });

    if (shifts.length === 0) {
      return NextResponse.json(
        { message: 'All shifts have already been synced to Google Calendar' },
        { status: 200 }
      );
    }

    const calendar = getGoogleCalendarClient(user.googleAccessToken);
    let createdEvents = 0;
    const errors: string[] = [];

    for (const shift of shifts) {
      try {
        // Convert date and times to proper datetime format
        const startDateTime = convertToDateTime(shift.date, shift.startTime);
        const endDateTime = convertToDateTime(shift.date, shift.endTime);

        if (!startDateTime || !endDateTime) {
          errors.push(`Invalid date/time format for shift on ${shift.date}`);
          continue;
        }

        const event: CalendarEvent = {
          summary: `Work Shift`,
          description: [
            `📅 Work Shift`,
            `🕐 ${shift.startTime} - ${shift.endTime}`,
            shift.notes ? `📝 Notes: ${shift.notes}` : ''
          ].filter(Boolean).join('\n\n'),
          start: {
            dateTime: startDateTime,
            timeZone: 'America/Toronto' // Adjust timezone as needed
          },
          end: {
            dateTime: endDateTime,
            timeZone: 'America/Toronto' // Adjust timezone as needed
          }
        };

        await calendar.events.insert({
          calendarId: calendarId,
          requestBody: event
        });

        // Mark shift as uploaded in the database using Prisma ORM
        await prisma.shift.update({
          where: { id: shift.id },
          data: { uploaded: true }
        });

        createdEvents++;
      } catch (eventError) {
        console.error(`Error creating event for shift on ${shift.date}:`, eventError);
        errors.push(`Failed to create event for ${shift.date}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${createdEvents} shifts to Google Calendar`,
      createdEvents,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Google Calendar' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function convertToDateTime(date: string, time: string): string | null {
  try {
    // Date should be in YYYY-MM-DD format
    // Time should be in "HH:MM AM/PM" format
    
    // Parse time
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    // Create ISO datetime string
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${date}T${hoursStr}:${minutesStr}:00`;
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
}
