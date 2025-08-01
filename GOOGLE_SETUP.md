# Google Calendar Integration Setup Instructions

## 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

## 2. Create a new project or select existing one

## 3. Enable Google Calendar API
- Go to "APIs & Services" > "Library"
- Search for "Google Calendar API"
- Click "Enable"

## 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Choose "Web application"
- Add these URLs to "Authorized redirect URIs":
  - http://localhost:3001/api/google/callback (for development)
  - https://yourdomain.com/api/google/callback (for production)

## 5. Add these environment variables to your .env file:

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback

## 6. For production, update GOOGLE_REDIRECT_URI to your production domain

## Note: Keep your Google Client Secret secure and never commit it to version control!
