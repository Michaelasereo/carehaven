# Troubleshooting: Verification Emails Not Sending

## Quick Diagnosis

Run this diagnostic script:
```bash
npx tsx scripts/test-verification-email-sending.ts your-email@domain.com
```

## Common Issues & Solutions

### Issue 1: Email Confirmations Disabled in Supabase

**Symptom:** No emails sent, no errors in console

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication** → **Settings** → **Email Auth**
4. Enable: **"Enable email confirmations"**
5. Set **"Confirm email"** to **ON**
6. Save changes

**Why this matters:** If email confirmations are disabled, Supabase won't send verification emails even when you call `auth.resend()`.

---

### Issue 2: Supabase Native Email Service Limitations

**Symptom:** Emails not sending, or rate limit errors

**Possible causes:**
- Free tier has email sending limits (usually 3-4 emails per hour)
- Supabase's default email service may have delivery issues
- Emails going to spam

**Solutions:**

#### Option A: Enable SMTP (Recommended)
Since you mentioned SMTP is disabled, you can re-enable it:

1. Go to Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings**
2. Configure with Brevo:
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587` (TLS)
   - **Username**: Your Brevo email or SMTP username
   - **Password**: Your Brevo SMTP key (`xsmtpsib-...`)
   - **Sender email**: `mycarehaven@gmail.com`
   - **Sender name**: Care Haven
3. Save and test

#### Option B: Check Email Logs
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for email sending errors
3. Check for rate limit messages

---

### Issue 3: Email Going to Spam

**Symptom:** Email sent successfully but not in inbox

**Solution:**
1. Check spam/junk folder
2. Check promotions tab (Gmail)
3. Add Supabase sender to contacts
4. For production: Use custom SMTP with verified domain

---

### Issue 4: Rate Limiting

**Symptom:** Error message about rate limits

**Solution:**
- Wait 1 hour and try again
- Upgrade Supabase plan for higher limits
- Use custom SMTP (Brevo) for unlimited emails

---

## Testing Steps

### Step 1: Check Supabase Settings

1. **Email Confirmations:**
   - Dashboard → Authentication → Settings → Email Auth
   - ✅ "Enable email confirmations" should be ON
   - ✅ "Confirm email" should be ON

2. **SMTP Settings (if using):**
   - Dashboard → Settings → Auth → SMTP Settings
   - Verify SMTP is configured correctly

### Step 2: Test Email Sending

```bash
# Test with a real email
npx tsx scripts/test-verification-email-sending.ts your-real-email@domain.com
```

### Step 3: Check Logs

1. **Browser Console:**
   - Open DevTools → Console
   - Look for email sending errors
   - Check for "Verification email sent" messages

2. **Supabase Logs:**
   - Dashboard → Logs → Auth Logs
   - Look for email sending attempts
   - Check for errors

3. **Server Logs:**
   - Check terminal/console where Next.js is running
   - Look for email sending logs

### Step 4: Test Signup Flow

1. Sign up with a **new email address** (not already in system)
2. Check browser console for:
   - "User created: [userId]"
   - "Verification email sent via Supabase native email service"
3. Check email inbox (and spam folder)
4. If no email, check Supabase Dashboard → Authentication → Users
   - Find the user
   - Check if `email_confirmed_at` is null (should be null if not verified)

---

## Immediate Fix: Enable SMTP

Since Supabase native email service may not be reliable, the quickest fix is to enable SMTP:

1. **Get Brevo SMTP Key:**
   - Go to Brevo Dashboard → SMTP & API → SMTP
   - Copy your SMTP key (starts with `xsmtpsib-`)

2. **Configure in Supabase:**
   - Supabase Dashboard → Settings → Auth → SMTP Settings
   - Enable SMTP
   - Enter Brevo SMTP credentials
   - Save

3. **Test:**
   ```bash
   npx tsx scripts/test-verification-email-sending.ts your-email@domain.com
   ```

---

## Current Implementation

The app now:
- ✅ Explicitly calls `/api/auth/send-verification-email` after signup
- ✅ Uses Supabase native `auth.resend()` for sending
- ✅ Handles errors gracefully (signup succeeds even if email fails)
- ✅ Provides resend button on verify-email page

**Next Steps:**
1. Verify email confirmations are enabled in Supabase
2. Check Supabase logs for email sending errors
3. Consider enabling SMTP for better reliability

---

## Need Help?

If emails still aren't sending:
1. Check Supabase Dashboard → Authentication → Settings
2. Review Supabase Dashboard → Logs
3. Test with diagnostic script
4. Consider enabling SMTP for production use
