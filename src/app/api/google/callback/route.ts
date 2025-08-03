import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Configure as dynamic since it uses authentication (cookies)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(new URL('/dashboard?google_error=access_denied', request.url));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?google_error=no_code', request.url));
    }
    
    // Get the authenticated user
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const oauth2Client = getGoogleOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store the tokens in the database using Prisma ORM
    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        googleAccessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null,
      }
    });
    
    return NextResponse.redirect(new URL('/dashboard?google_connected=true', request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?google_error=callback_failed', request.url));
  }
  // Removed prisma.$disconnect() - let connection pooling handle this
}
