import { google } from 'googleapis';

export function getGoogleCalendarClient(authToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: authToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}