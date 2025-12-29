# Google OAuth Setup Guide for Care Haven

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "Care Haven" (or your preferred name)
   - Click "Create"

### 1.2 Enable Google+ API
1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click on it and click **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - **App name**: Care Haven
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click **Save and Continue**
   - Add scopes (optional, but recommended):
     - `email`
     - `profile`
     - `openid`
   - Click **Save and Continue**
   - Add test users (if in testing mode) or skip
   - Click **Save and Continue**
   - Review and click **Back to Dashboard**

4. Now create the OAuth client ID:
   - **Application type**: Web application
   - **Name**: Care Haven Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://kpjwpwjxjqmkayaouycx.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://kpjwpwjxjqmkayaouycx.supabase.co/auth/v1/callback
     https://your-netlify-domain.netlify.app/auth/callback
     ```
   - Click **Create**

5. **Copy your credentials**:
   - **Client ID**: (starts with something like `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret**: (copy this immediately, you won't see it again)

## Step 2: Configure Google OAuth in Supabase

### 2.1 Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **kpjwpwjxjqmkayaouycx**

### 2.2 Enable Google Provider
1. Navigate to **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to enable it

### 2.3 Add Google OAuth Credentials
1. In the Google provider settings, enter:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
   
2. **Redirect URL**: Supabase will show you a redirect URL like:
   ```
   https://kpjwpwjxjqmkayaouycx.supabase.co/auth/v1/callback
   ```
   **IMPORTANT**: Copy this URL - you'll need it for Step 3!

3. Click **Save**

## Step 3: Add Supabase Redirect URL to Google Cloud Console

### 3.1 Update Authorized Redirect URIs
1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://kpjwpwjxjqmkayaouycx.supabase.co/auth/v1/callback
   ```
5. Click **Save**

## Step 4: Verify Configuration

### 4.1 Test the Setup
1. Start your development server:
   ```bash
   cd /Users/macbook/Desktop/carehaven
   npm run dev
   ```

2. Visit `http://localhost:3000/auth/signin`
3. Click "Continue with Google"
4. You should be redirected to Google's consent screen
5. After authorizing, you should be redirected back to your app

## Step 5: Production Setup (When Deploying)

### 5.1 Add Production Redirect URLs
When you deploy to Netlify, add these to Google Cloud Console:

**Authorized JavaScript origins**:
```
https://your-app-name.netlify.app
```

**Authorized redirect URIs**:
```
https://your-app-name.netlify.app/auth/callback
https://kpjwpwjxjqmkayaouycx.supabase.co/auth/v1/callback
```

### 5.2 Update Supabase Redirect URLs
In Supabase Dashboard → Authentication → URL Configuration:
- Add your production site URL to **Site URL**
- Add `https://your-app-name.netlify.app/auth/callback` to **Redirect URLs**

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Make sure the redirect URI in Google Cloud Console exactly matches Supabase's callback URL
   - Check for trailing slashes and http vs https

2. **"Access blocked: This app's request is invalid"**:
   - Your OAuth consent screen might not be published
   - Go to OAuth consent screen and publish it (if ready for production)
   - Or add test users if in testing mode

3. **"Invalid client" error**:
   - Double-check your Client ID and Client Secret in Supabase
   - Make sure there are no extra spaces when copying

4. **Not redirecting after Google login**:
   - Verify the redirect URL in your app code matches Supabase's callback URL
   - Check that the callback route is properly set up

## Security Notes

- **Never commit** your Client Secret to version control
- Keep your Google Client Secret secure
- Use environment variables for all sensitive keys
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Quick Reference

**Your Supabase Project URL**: `https://kpjwpwjxjqmkayaouycx.supabase.co`

**Supabase Callback URL**: `https://kpjwpwjxjqmkayaouycx.supabase.co/auth/v1/callback`

**Local Development Callback**: `http://localhost:3000/auth/callback`

**Required Scopes**:
- `email`
- `profile`
- `openid`

