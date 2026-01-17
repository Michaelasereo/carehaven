# Email Verification Setup

## Overview

This application uses **Supabase's native email verification** with **Brevo SMTP** for sending emails. Supabase handles the verification flow automatically, and emails are sent through Brevo SMTP configured in the Supabase dashboard.

## How It Works

1. **User signs up** → Account created in Supabase via `supabase.auth.signUp()`
2. **Verification email sent** → Supabase automatically sends verification email via Brevo SMTP
3. **User clicks link** → Supabase handles verification via `/auth/callback`
4. **Email confirmed** → User can now sign in

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
BREVO_API_KEY=your_brevo_api_key  # For programmatic emails (notifications)
BREVO_SMTP_KEY=xsmtpsib-...  # For Supabase SMTP configuration (optional - configured in Supabase dashboard)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local dev
# Or for production:
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Note:** 
- Email verification uses Supabase's native flow with Brevo SMTP configured in the Supabase dashboard
- The `BREVO_API_KEY` is used for programmatic emails (notifications, alerts) sent via the `lib/email/client.ts` module
- The `BREVO_SMTP_KEY` should be configured in Supabase Dashboard → Settings → Auth → SMTP Settings (not in `.env.local` for runtime use)

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

### Emails Still Not Sending

1. **Check Resend API Key**
   - Verify `RESEND_API_KEY` is set correctly
   - Check Resend dashboard for API key status

2. **Check Resend Sender Email**
   - Current sender: `asereopeyemimichael@gmail.com`
   - Make sure this email is verified in Resend
   - Or update to a verified sender email in `lib/email/client.ts`

3. **Check Server Logs**
   - Look for errors in terminal/console
   - Check Resend dashboard for delivery status

4. **Test Resend API Directly**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "Care Haven <asereopeyemimichael@gmail.com>",
       "to": ["test@example.com"],
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

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

1. **Run the migration** to create the tokens table
2. **Test signup flow** with a real email
3. **Check Resend dashboard** to see if emails are being sent
4. **Verify sender email** in Resend (or use a verified email)

The system uses Supabase's native email verification with Brevo SMTP. Supabase handles verification automatically, and emails are sent through Brevo configured in the Supabase dashboard.
