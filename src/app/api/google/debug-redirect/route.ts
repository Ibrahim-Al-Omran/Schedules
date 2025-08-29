import { NextRequest, NextResponse } from 'next/server';

// This endpoint helps debug the correct redirect URI for Google OAuth setup
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const redirectUri = `${baseUrl}/api/google/callback`;
    
    const debugInfo = {
      current_url: request.url,
      base_url: baseUrl,
      redirect_uri: redirectUri,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
        VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      },
      instructions: {
        step1: "Copy the 'redirect_uri' value above",
        step2: "Go to Google Cloud Console > APIs & Services > Credentials",
        step3: "Edit your OAuth 2.0 Client ID",
        step4: "Add the redirect_uri to 'Authorized redirect URIs'",
        step5: "Save and try connecting Google Calendar again"
      }
    };
    
    return NextResponse.json(debugInfo, { 
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get debug info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
