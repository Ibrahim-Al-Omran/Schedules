import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';

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

    // Create OAuth client with dynamic redirect URI (same as auth route)
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const dynamicRedirectUri = `${baseUrl}/api/google/callback`;
    
    console.log('Callback - Base URL:', baseUrl);
    console.log('Callback - Dynamic Redirect URI:', dynamicRedirectUri);

    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      dynamicRedirectUri
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store the tokens in the database using Supabase
    await adminDb.users.update(authUser.userId, {
      googleAccessToken: tokens.access_token || null,
      googleRefreshToken: tokens.refresh_token || null,
    });
    
    return NextResponse.redirect(new URL('/dashboard?google_connected=true', request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?google_error=callback_failed', request.url));
  }
  // Removed prisma.$disconnect() - let connection pooling handle this
}
