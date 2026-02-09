# Test Signup and Email Verification

## Quick Test via Browser

1. **Open the signup page:**
   ```
   http://localhost:3000/auth/signup
   ```

2. **Sign up with:**
   - Email: `asereope@gmail.com`
   - Password: `Carehaven1998#`

3. **After signup:**
   - You should be redirected to `/auth/verify-email`
   - Check your email inbox (and spam folder)
   - Look for email from "Care Haven"

4. **Click the verification link** in the email

5. **You should be redirected** to the sign-in page

## Test Email API Directly

If you want to test just the email sending:

```bash
curl -X POST http://localhost:3000/api/auth/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "asereope@gmail.com"}'
```

## Check Logs

Watch your terminal where the dev server is running for:
- Any errors when sending email
- Brevo API responses
- Database operations

## Troubleshooting

If email doesn't arrive:
1. Check browser console (F12) for errors
2. Check server terminal logs
3. Verify `BREVO_API_KEY` is set in `.env.local`
4. Check Brevo dashboard for email delivery status
5. Try the "Resend Verification Email" button
