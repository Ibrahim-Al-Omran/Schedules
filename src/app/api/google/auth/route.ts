import { NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google OAuth environment variables');
      return NextResponse.json(
        { error: 'Google Calendar integration not configured. Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.' },
        { status: 500 }
      );
    }

    // Check if using placeholder values
    if (process.env.GOOGLE_CLIENT_ID === 'your-google-client-id-here' || 
        process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret-here') {
      console.error('Using placeholder Google OAuth values');
      return NextResponse.json(
        { error: 'Please replace the placeholder values in your .env file with real Google OAuth credentials from Google Cloud Console. See GOOGLE_SETUP_DETAILED.md for instructions.' },
        { status: 500 }
      );
    }

    console.log('Using Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL_URL:', process.env.VERCEL_URL);
    console.log('VERCEL_PROJECT_PRODUCTION_URL:', process.env.VERCEL_PROJECT_PRODUCTION_URL);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

    const oauth2Client = getGoogleOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
    
    console.log('Generated auth URL:', authUrl);
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
