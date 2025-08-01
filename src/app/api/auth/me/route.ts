import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserWithGoogleToken {
  id: string;
  name: string;
  email: string;
  hasGoogleToken: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with Google token status
    const userWithTokens = await prisma.$queryRaw`
      SELECT id, name, email, "googleAccessToken" IS NOT NULL as "hasGoogleToken"
      FROM "User" 
      WHERE id = ${authUser.userId}
    ` as UserWithGoogleToken[];

    if (!userWithTokens.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userWithTokens[0];

    return NextResponse.json({
      user: {
        ...authUser,
        googleAccessToken: user.hasGoogleToken
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
}
