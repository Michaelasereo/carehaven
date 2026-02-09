# Email Verification Setup

## Overview

This application uses **Supabase's native email verification service** for verification emails. SMTP is currently **disabled** (code is kept for future use). General emails (notifications, alerts) use Resend/Brevo.

## How It Works

1. **User signs up** → Account created in Supabase via `supabase.auth.signUp()`
2. **Verification email sent** → Supabase automatically sends verification email via native email service (SMTP disabled)
3. **User clicks link** → Supabase handles verification via `/auth/callback`
4. **Email confirmed** → User can now sign in

**Note:** SMTP configuration is disabled but code remains for future re-enablement.

## Setup Steps

### 1. Run Database Migration

The email verification tokens table needs to be created:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase Dashboard:
# SQL Editor → Run: supabase/migrations/008_email_verification_tokens.sql
```

### 2. Environment Variables

Make sure these are set in `.env.local`:

```bash
# Supabase (Required for verification emails)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Services (for general emails - notifications, alerts)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional - for general emails
BREVO_API_KEY=your_brevo_api_key  # Fallback for general emails

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local dev
# Or for production:
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Note:** 
- **Verification emails** use Supabase's native email service (SMTP disabled)
- **General emails** (notifications, alerts) use Resend → Brevo fallback via `lib/email/client.ts`
- SMTP configuration is **disabled** but code is kept for future re-enablement
- No SMTP configuration needed in Supabase dashboard for verification emails

### 3. Test the Flow

1. Sign up with a new email
2. Check your inbox (and spam folder) for verification email
3. Click the verification link
4. You should be redirected to sign in page

## API Endpoints

### POST `/api/auth/send-verification-email`
Sends a verification email to the specified email address.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### GET `/api/auth/verify-email?token=xxx&email=xxx`
Verifies the email token and confirms the user's email.

**Redirects to:**
- `/auth/signin?verified=true` on success
- `/auth/verify-email?error=invalid_token` on failure

## Troubleshooting

### Verification Emails Not Sending

1. **Check Supabase Configuration**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - Check Supabase dashboard → Authentication → Settings
   - Ensure email confirmations are enabled

2. **Check Supabase Email Service**
   - Go to Supabase Dashboard → Settings → Auth
   - Verify email service is enabled (SMTP is disabled, using native service)
   - Check email rate limits if on free tier

3. **Check Server Logs**
   - Look for errors in terminal/console
   - Check for "Verification email sent via Supabase native email service" message

### General Emails (Notifications) Not Sending

1. **Check Resend API Key** (for general emails)
   - Verify `RESEND_API_KEY` is set correctly
   - Check Resend dashboard for API key status

2. **Check Brevo API Key** (fallback for general emails)
   - Verify `BREVO_API_KEY` is set correctly
   - Check Brevo dashboard for delivery status

3. **Check Server Logs**
   - Look for email sending logs
   - Check which service was used (Resend/Brevo)

### Token Verification Fails

1. **Check Database Table**
   - Ensure `email_verification_tokens` table exists
   - Run migration if needed

2. **Check Token Expiration**
   - Tokens expire after 24 hours
   - User can request a new verification email

### Migration Issues

If the migration fails, you can create the table manually in Supabase Dashboard:

```sql
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id 
  ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
  ON email_verification_tokens(token);
```

## Next Steps

1. **Test signup flow** with a real email
2. **Check Supabase dashboard** → Authentication → Users to see verification status
3. **Check email inbox** (and spam folder) for verification email
4. **Test general emails** (notifications) to verify Resend/Brevo fallback works

## Email Service Architecture

- **Verification Emails**: Supabase native email service (SMTP disabled)
- **General Emails**: Resend (primary) → Brevo (fallback)
- **SMTP**: Disabled but code kept for future re-enablement

The system uses Supabase's native email service for verification emails. General emails (notifications, alerts) use Resend/Brevo for better deliverability and customization.
