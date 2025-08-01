import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear Google Calendar connection for the user
    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
      },
    });

    return NextResponse.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
}
