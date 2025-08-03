import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Add caching configuration for this route
export const revalidate = 60; // Cache for 60 seconds
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

    const response = NextResponse.json({
      user: {
        ...authUser,
        googleAccessToken: hasGoogleConnection,
        // Keep debugging info for development only
        ...(process.env.NODE_ENV === 'development' && {
          googleTokenDebug: {
            hasAccessToken: !!user.googleAccessToken,
            hasRefreshToken: !!user.googleRefreshToken,
            fullyConnected: hasGoogleConnection
          }
        })
      },
    });

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    
    return response;
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
