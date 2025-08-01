import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      // Show partial values for debugging (first 4 chars + asterisks)
      jwtSecretPreview: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 4)}****` : 'MISSING',
      databaseUrlPreview: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 10)}****` : 'MISSING',
      googleClientIdPreview: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 8)}****` : 'MISSING',
    };

    return NextResponse.json({
      status: 'Environment check',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check environment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
