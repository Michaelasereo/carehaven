# User Story Test Guide: Sign Up → Email Verification → Login → Dashboard

This guide tests the complete user authentication flow for regular users (patients).

## Prerequisites

1. Development server is running: `npm run dev`
2. Environment variables are configured:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Brevo email service configured

## Test Flow

### Step 1: User Sign Up

**URL:** `http://localhost:3000/auth/signup`

**Test Steps:**
1. Navigate to `/auth/signup`
2. Enter a valid email address (e.g., `testuser@example.com`)
3. Enter a password that meets all requirements:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
   - One special character
   - Example: `Test123!@#`
4. Confirm the password (same as above)
5. Click "Create Account" button

**Expected Results:**
- ✅ Form validation shows all password requirements are met
- ✅ Form submission succeeds
- ✅ Success message appears: "Account created successfully!"
- ✅ Message shows: "We've sent a verification email to [email]"
- ✅ Redirects to `/auth/verify-email?email=[email]`
- ✅ User account is created in Supabase
- ✅ Verification email is sent via Brevo API

**Check Console/Network:**
- Check browser console for: "User created: [userId]"
- Check Network tab for successful POST to `/api/auth/send-verification-email`
- Check Supabase dashboard to confirm user exists with `email_confirmed_at = null`

---

### Step 2: Email Verification

**Email Check:**
1. Open email inbox for the test email address
2. Look for email from Care Haven (sent via Brevo)
3. Email should contain a verification link

**Expected Email Content:**
- Subject: "Verify your Care Haven email address" (or similar)
- Body contains verification link
- Link format: `http://localhost:3000/api/auth/verify-email?token=[token]&email=[email]`

**Verification Steps:**
1. Click the verification link in the email
2. OR manually navigate to `/auth/verify-email` page to see instructions

**Expected Results After Clicking Link:**
- ✅ Redirects to `/api/auth/verify-email?token=[token]&email=[email]`
- ✅ Token is validated
- ✅ Email is marked as verified in Supabase (`email_confirmed_at` is set)
- ✅ Redirects to `/auth/signin?verified=true`
- ✅ Sign-in page shows success message: "Email verified successfully! You can now sign in."

**Check Database:**
- Verify in Supabase that `auth.users.email_confirmed_at` is now set
- Verify in database that `email_verification_tokens.used = true` for the token

---

### Step 3: User Login

**URL:** `http://localhost:3000/auth/signin`

**Test Steps:**
1. Navigate to `/auth/signin`
2. Enter the email used in sign up
3. Enter the password used in sign up
4. Optionally check "Remember me"
5. Click "Sign In" button

**Expected Results:**
- ✅ Form submits successfully
- ✅ POST request to `/api/auth/signin` succeeds (200 status)
- ✅ Cookies are set (check DevTools → Application → Cookies)
  - Should see `sb-[project-ref]-auth-token` cookie
  - Should see `auth-debug` cookie
- ✅ Redirects to `/auth/callback?next=/patient`
- ✅ Session is created in Supabase

**Check Console/Network:**
- Browser console shows: "✅ Server-side sign-in successful"
- Browser console shows: "🍪 Current cookies after sign-in: [cookies]"
- Network tab shows successful POST to `/api/auth/signin` with 200 response
- Response contains: `{ success: true, user: { id, email, email_confirmed: true } }`

**Error Cases to Test:**
- ❌ Wrong password → Should show: "Invalid email or password. Please try again."
- ❌ Unverified email → Should show: "Please verify your email before signing in..."
- ❌ Non-existent email → Should show: "Invalid email or password..."

---

### Step 4: Dashboard Access

**Expected Flow After Login:**

1. **Callback Route (`/auth/callback`):**
   - ✅ Validates user session
   - ✅ Checks if profile exists (creates one if missing with role='patient')
   - ✅ Checks email verification (should pass)
   - ✅ Checks profile completion (may redirect to `/complete-profile` if incomplete)
   - ✅ Determines user role (should be 'patient')
   - ✅ Redirects to `/patient` dashboard

2. **Dashboard Layout (`/patient`):**
   - ✅ Validates authentication (server-side)
   - ✅ Fetches user profile
   - ✅ Checks `profile_completed` status
   - ✅ Renders dashboard with patient sidebar
   - ✅ Shows header with user info

**Expected Dashboard Experience:**
- ✅ URL is `/patient` (or redirected based on role)
- ✅ Dashboard layout loads with sidebar and header
- ✅ No redirect to `/auth/signin` (authentication working)
- ✅ No redirect to `/complete-profile` (if profile is complete)
- ✅ User can see dashboard content

**Check Points:**
- Browser console should NOT show "Invalid session in dashboard layout, redirecting to sign-in"
- Network tab shows successful GET requests to dashboard pages
- User can navigate within dashboard without being logged out

---

## Complete Test Checklist

### ✅ Sign Up Flow
- [ ] Can access `/auth/signup` page
- [ ] Form validates email format
- [ ] Form validates password requirements (all 5 checks)
- [ ] Form validates password confirmation match
- [ ] Submit creates user account in Supabase
- [ ] Verification email is sent via API
- [ ] Success message appears
- [ ] Redirects to verification page

### ✅ Email Verification Flow
- [ ] Verification email arrives in inbox
- [ ] Email contains valid verification link
- [ ] Clicking link verifies email in Supabase
- [ ] Database shows `email_confirmed_at` is set
- [ ] Redirects to sign-in with success message
- [ ] Can resend verification email if needed

### ✅ Login Flow
- [ ] Can access `/auth/signin` page
- [ ] Form accepts email and password
- [ ] Login with correct credentials succeeds
- [ ] Cookies are set properly (check DevTools)
- [ ] Session is created in Supabase
- [ ] Error messages work for invalid credentials
- [ ] Rate limiting works (test with 5+ failed attempts)

### ✅ Dashboard Access
- [ ] Login redirects to callback route
- [ ] Callback creates profile if missing
- [ ] Callback checks email verification
- [ ] Callback redirects based on role
- [ ] Dashboard layout validates authentication
- [ ] Dashboard displays correctly
- [ ] No unexpected redirects to sign-in
- [ ] User can navigate dashboard

### ✅ Edge Cases
- [ ] Cannot access dashboard without login
- [ ] Cannot access dashboard with unverified email
- [ ] Cannot sign up with existing email
- [ ] Password requirements are enforced
- [ ] Remember me checkbox works (if implemented)

---

## Manual Testing Commands

### Start Development Server
```bash
npm run dev
```

### Check Supabase User
```bash
# In Supabase dashboard:
# Go to Authentication → Users
# Verify user exists and email_confirmed_at is set after verification
```

### Check Database Profile
```bash
# In Supabase dashboard:
# Go to Table Editor → profiles
# Verify profile exists with:
# - id: matches user id
# - email: matches user email
# - role: 'patient'
# - profile_completed: false (initially) or true
```

### Test Email Service
```bash
# Check Brevo/email service logs to confirm emails are sent
# Or use test email service like Mailtrap for development
```

---

## Troubleshooting

### Sign Up Issues
- **Email not sending:** Check Brevo API configuration and logs
- **User creation fails:** Check Supabase connection and credentials
- **Form validation errors:** Check browser console for JavaScript errors

### Email Verification Issues
- **Link not working:** Check token validation logic in `/api/auth/verify-email`
- **Email not arriving:** Check spam folder, email service configuration
- **Verification not saving:** Check Supabase admin API permissions

### Login Issues
- **Cookies not set:** Check `/api/auth/signin` cookie setting logic
- **Session not created:** Check Supabase client configuration
- **Redirect loops:** Check middleware and callback route logic

### Dashboard Access Issues
- **Redirected to sign-in:** Check authentication middleware
- **Profile not found:** Check profile creation in callback route
- **Wrong dashboard:** Check role-based routing logic

---

## Next Steps

After completing this test flow successfully, proceed to test:
1. Profile completion flow (`/complete-profile`)
2. Role-specific dashboard features
3. Password reset flow
4. Google OAuth sign-in (if applicable)
