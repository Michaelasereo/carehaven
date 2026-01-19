# Production Email Setup Guide

## Issue: Email Verification Not Sending in Production

If you're experiencing issues with email verification not sending in production, follow these steps to diagnose and fix the problem.

## Required Environment Variables in Netlify

You **MUST** set the following environment variables in Netlify Dashboard:

1. Go to **Netlify Dashboard** → Your Site → **Site settings** → **Environment variables**
2. Add the following variables:

### Required for Email Sending

```
BREVO_API_KEY=your_brevo_api_key_here
```

**Important:** 
- This is **required** for verification code emails to work
- Without this, you'll get a 500 error: "Email service is not configured"
- Get your API key from [Brevo Dashboard](https://app.brevo.com/settings/keys/api)

### Other Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://carehaven.app
```

## Verify Email Configuration

After setting environment variables, test your email configuration:

### Option 1: Use Debug Endpoint

Visit: `https://carehaven.app/api/debug/email-config`

This will show you:
- Whether BREVO_API_KEY is configured
- First 10 characters of the API key (for verification)
- Other environment variables

### Option 2: Check Netlify Function Logs

1. Go to Netlify Dashboard → Your Site → **Functions** tab
2. Click on a function that uses email (e.g., `send-verification-code`)
3. Check the logs for error messages

Common errors:
- `BREVO_API_KEY is not configured` → Set the environment variable
- `Invalid Brevo API key` → Check your API key is correct
- `Sender email not verified` → Verify sender email in Brevo

## Sender Email Verification

The sender email `mycarehaven@carehaven.app` **MUST** be verified in Brevo:

1. Go to [Brevo Dashboard](https://app.brevo.com/)
2. Navigate to **Settings** → **Senders** → **SMTP & API**
3. Verify that `mycarehaven@carehaven.app` is listed and verified
4. If not verified, click "Verify" and follow the instructions

**Alternative:** If you need to use a different sender email, update it in:
- `lib/email/client.ts` (line 39): Change `email: 'mycarehaven@carehaven.app'`

## Step-by-Step Fix

1. **Get your Brevo API Key**
   - Log in to [Brevo Dashboard](https://app.brevo.com/)
   - Go to **Settings** → **API Keys**
   - Copy your API key (starts with `xkeysib-...`)

2. **Set Environment Variable in Netlify**
   - Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
   - Click **Add variable**
   - Key: `BREVO_API_KEY`
   - Value: Your Brevo API key
   - **Important:** Make sure "Deploy context" is set to "All deploy contexts" or "Production"
   - Click **Save**

3. **Redeploy**
   - After adding the environment variable, trigger a new deploy:
     - Option A: Push a new commit to trigger auto-deploy
     - Option B: Go to Netlify Dashboard → **Deploys** → **Trigger deploy**

4. **Test**
   - Try signing up or requesting a verification code
   - Check the email inbox (and spam folder)
   - Check Netlify Function logs if it fails

## Troubleshooting

### Error: "Email service is not configured"
**Solution:** `BREVO_API_KEY` is missing in Netlify environment variables.

### Error: "Invalid Brevo API key"
**Solution:** 
- Check that your API key is correct
- Make sure there are no extra spaces
- Regenerate API key in Brevo if needed

### Error: "Sender email not verified"
**Solution:** 
- Verify `mycarehaven@carehaven.app` in Brevo Dashboard
- Or change the sender email to a verified one in `lib/email/client.ts`

### Emails not received
**Possible causes:**
- Check spam folder
- Verify recipient email address
- Check Brevo dashboard for email logs/delivery status
- Check rate limits in Brevo (free tier has limits)

## Quick Test

After setting up environment variables, you can test the email configuration:

```bash
# Visit this URL in your browser (production):
https://carehaven.app/api/debug/email-config

# Should return:
{
  "status": "OK",
  "emailConfig": {
    "brevoApiKeyConfigured": true,
    "brevoApiKeyLength": 70,  // or similar
    "brevoApiKeyPrefix": "xkeysib-...",
    "appUrl": "https://carehaven.app"
  }
}
```

If `brevoApiKeyConfigured` is `false`, the environment variable is not set correctly.

## After Fixing

Once you've set `BREVO_API_KEY` in Netlify:
1. Redeploy the site (environment variables take effect on new deploys)
2. Test signup/verification code flow
3. Check Netlify Function logs to confirm emails are sending
