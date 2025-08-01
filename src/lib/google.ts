import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events', // Full access to manage calendar events
  'https://www.googleapis.com/auth/calendar.readonly' // Read-only access to calendar
];

export function getGoogleCalendarClient(authToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: authToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function generateAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

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