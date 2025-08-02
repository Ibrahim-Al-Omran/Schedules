import { NextResponse } from 'next/server';

export async function GET() {
  // Get the base URL for the current environment
  function getBaseUrl(): string {
    // In production on Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Custom domain or explicit override
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Production fallback (your actual domain)
    if (process.env.NODE_ENV === 'production') {
      return 'https://schedules-ashen.vercel.app';
    }
    
    // Local development
    return 'http://localhost:3000';
  }

  // Get the redirect URI for OAuth
  function getRedirectUri(): string {
    // Allow explicit override via environment variable
    if (process.env.GOOGLE_REDIRECT_URI) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    
    // Generate dynamically based on current environment
    return `${getBaseUrl()}/api/google/callback`;
  }

  const debugInfo = {
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    generatedBaseUrl: getBaseUrl(),
    generatedRedirectUri: getRedirectUri(),
    googleClientIdSet: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
  };

  return NextResponse.json({
    message: 'Google OAuth Debug Information',
    ...debugInfo,
    instructions: {
      step1: 'Copy the "generatedRedirectUri" value below',
      step2: 'Go to Google Cloud Console > APIs & Services > Credentials',
      step3: 'Edit your OAuth 2.0 Client ID',
      step4: 'Add the redirect URI to "Authorized redirect URIs"',
      step5: 'Save and try connecting Google Calendar again'
    }
  });
}
