import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

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

    // Get user with Google token status
    const userWithTokens = await prisma.$queryRaw`
      SELECT id, name, email, "googleAccessToken" IS NOT NULL as "hasGoogleToken"
      FROM "User" 
      WHERE id = ${authUser.userId}
    ` as any[];

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
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
