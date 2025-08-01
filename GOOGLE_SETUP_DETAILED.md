# DETAILED Google Calendar Setup Guide

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com/
- Sign in with your Google account

### 2. Create or Select a Project
- Click on the project dropdown at the top
- Either select an existing project or click "New Project"
- If creating new: Give it a name like "Schedule App" and click "Create"

### 3. Enable Google Calendar API
- In the left sidebar, go to "APIs & Services" → "Library"
- Search for "Google Calendar API"
- Click on it and press "ENABLE"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials"
- Click "CREATE CREDENTIALS" → "OAuth client ID"
- If prompted, configure the OAuth consent screen first:
  - Choose "External" user type
  - Fill in App name: "Schedule App"
  - Add your email in User support email and Developer contact
  - Save and continue through the screens
- Back to creating OAuth client ID:
  - Application type: "Web application"
  - Name: "Schedule App Client"
  - Authorized redirect URIs: Add this exact URL:
    `http://localhost:3001/api/google/callback`
- Click "CREATE"

### 5. Copy Your Credentials
- You'll see a popup with:
  - Client ID (starts with something like: 123456789-abcdef...)
  - Client secret (looks like: GOCSPX-...)
- COPY THESE VALUES!

### 6. Update Your .env File
Replace the placeholder values with your real credentials:

```
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your_actual_secret_here"
```

### 7. Restart Your Development Server
After updating .env, restart your dev server for changes to take effect.

## Important Notes:
- Keep your Client Secret private and secure
- The Client ID should end with ".apps.googleusercontent.com"
- The redirect URI must match exactly what you put in Google Console
- If you get "unauthorized_client" error, double-check the redirect URI matches
