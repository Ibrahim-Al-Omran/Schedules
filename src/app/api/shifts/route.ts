import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const authUser = getAuthUser(req as any);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch shifts for the authenticated user only using raw SQL
    const shifts = await prisma.$queryRaw`
      SELECT s.id, s.date, s."startTime", s."endTime", s.coworkers, s.notes, s."createdAt",
             u.id as "userId", u.name as "userName", u.email as "userEmail"
      FROM "Shift" s
      JOIN "User" u ON s."userId" = u.id
      WHERE s."userId" = ${authUser.userId}
      ORDER BY s.date DESC
    `;

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authUser = getAuthUser(req as any);
    
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

    // Create new shift for the authenticated user using raw SQL
    const result = await prisma.$queryRaw`
      INSERT INTO "Shift" (id, date, "startTime", "endTime", coworkers, notes, "createdAt", "userId")
      VALUES (gen_random_uuid(), ${date}, ${startTime}, ${endTime}, ${coworkers || ''}, ${notes || ''}, NOW(), ${authUser.userId})
      RETURNING id, date, "startTime", "endTime", coworkers, notes, "createdAt", "userId"
    `;

    const shift = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    );
  }
}
