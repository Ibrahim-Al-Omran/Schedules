import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events', // Full access to manage calendar events
  'https://www.googleapis.com/auth/calendar.readonly' // Read-only access to calendar
];

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

export function getGoogleCalendarClient(authToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: authToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export function getGoogleOAuth2Client() {
  const redirectUri = getRedirectUri();
  
  console.log('Using redirect URI:', redirectUri);
  
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