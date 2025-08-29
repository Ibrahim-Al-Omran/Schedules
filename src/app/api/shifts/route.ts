import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma, executeWithRetry } from '@/lib/prisma';

type ShiftWithUser = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  coworkers: string;
  notes: string | null;
  uploaded: boolean;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

// Configure as dynamic since it uses authentication (cookies)
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Increase timeout for cold starts

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch shifts for the authenticated user only - optimized query
    const shifts: ShiftWithUser[] = await executeWithRetry(async () => {
      return await prisma.shift.findMany({
        where: { userId: authUser.userId },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          coworkers: true,
          notes: true,
          uploaded: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { date: 'desc' }
      }) as ShiftWithUser[];
    });

    // Transform the data to match the expected format
    const transformedShifts = shifts.map((shift: ShiftWithUser) => ({
      id: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      coworkers: shift.coworkers,
      notes: shift.notes,
      uploaded: shift.uploaded,
      createdAt: shift.createdAt,
      userId: shift.user.id,
      userName: shift.user.name,
      userEmail: shift.user.email,
    }));

    return NextResponse.json({ shifts: transformedShifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
  // Removed prisma.$disconnect() - let connection pooling handle this
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

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Date, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Create new shift for the authenticated user using Prisma ORM
    const shift = await executeWithRetry(async () => {
      return await prisma.shift.create({
        data: {
          date,
          startTime,
          endTime,
          coworkers: coworkers || '',
          notes: notes || '',
          uploaded: false,
          userId: authUser.userId,
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          coworkers: true,
          notes: true,
          uploaded: true,
          createdAt: true,
          userId: true,
        }
      });
    });

    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Failed to create shift', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
  // Removed prisma.$disconnect() - let connection pooling handle this
}
