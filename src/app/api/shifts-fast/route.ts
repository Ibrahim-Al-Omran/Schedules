import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/supabase';

// Configure as Edge Runtime for even faster performance (optional but recommended)
// export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch shifts using Supabase API (instant, no connection overhead)
    const shifts = await db.shifts.findMany(
      { userId: authUser.userId },
      { date: 'desc' }
    );

    // Transform the data to match the expected format
    const transformedShifts = shifts.map((shift: { id: string; date: string; startTime: string; endTime: string; coworkers: string; notes: string; uploaded: boolean; createdAt: string; updatedAt: string; userId?: string; user?: { id: string; name: string; email: string } }) => ({
      id: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      coworkers: shift.coworkers,
      notes: shift.notes,
      uploaded: shift.uploaded,
      createdAt: shift.createdAt,
      userId: shift.user?.id || shift.userId,
      userName: shift.user?.name || '',
      userEmail: shift.user?.email || '',
    }));

    return NextResponse.json({ shifts: transformedShifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { date, startTime, endTime, coworkers, notes } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: date, startTime, endTime' },
        { status: 400 }
      );
    }

    // Create shift using Supabase API
    const shift = await db.shifts.create({
      date,
      startTime,
      endTime,
      coworkers: coworkers || '',
      notes: notes || null,
      uploaded: false,
      userId: authUser.userId,
    });

    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Failed to create shift', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
