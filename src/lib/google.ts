import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events', // Full access to manage calendar events
  'https://www.googleapis.com/auth/calendar.readonly' // Read-only access to calendar
];

// Get the base URL for the current environment
function getBaseUrl(): string {
  // Explicit override takes priority
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In production on Vercel, try multiple environment variables
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    // Try Vercel's production URL first
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    
    // Fallback to current deployment URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Last resort hardcoded fallback
    return 'https://schedules-ashen.vercel.app';
  }
  
  // In Vercel preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
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

export function getGoogleCalendarClient(authToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: authToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export function getGoogleOAuth2Client() {
  const redirectUri = getRedirectUri();
  const baseUrl = getBaseUrl();
  
  console.log('Google OAuth Debug Info:');
  console.log('- Base URL:', baseUrl);
  console.log('- Redirect URI:', redirectUri);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- VERCEL:', process.env.VERCEL);
  console.log('- VERCEL_URL:', process.env.VERCEL_URL);
  console.log('- VERCEL_PROJECT_PRODUCTION_URL:', process.env.VERCEL_PROJECT_PRODUCTION_URL);
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function generateAuthUrl() {
  const oauth2Client = getGoogleOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Ensures refresh tokens are returned
    scope: SCOPES, // Include the scopes defined above
    include_granted_scopes: true, // Enable incremental authorization
  });
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
}