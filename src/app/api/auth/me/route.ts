import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with Google token status using Prisma ORM
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        googleAccessToken: true,
        googleRefreshToken: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has both access and refresh tokens (properly connected)
    const hasGoogleConnection = !!(user.googleAccessToken && user.googleRefreshToken);

    return NextResponse.json({
      user: {
        ...authUser,
        googleAccessToken: hasGoogleConnection,
        // Add debugging info (remove in production)
        googleTokenDebug: {
          hasAccessToken: !!user.googleAccessToken,
          hasRefreshToken: !!user.googleRefreshToken,
          fullyConnected: hasGoogleConnection
        }
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    console.error('Environment check:', {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    });
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    );
  }
  // Removed prisma.$disconnect() - let connection pooling handle this
}
