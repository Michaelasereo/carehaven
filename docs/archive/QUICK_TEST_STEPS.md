# Quick Test Steps: User Sign Up → Email Verification → Login → Dashboard

## Prerequisites Check

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

2. **Run the test script** to verify endpoints are accessible:
   ```bash
   node scripts/test-user-story-auth.js
   ```

## Manual Testing Steps

### ✅ Step 1: User Sign Up

1. Open browser and navigate to: `http://localhost:3000/auth/signup`

2. Fill in the form:
   - **Email:** Use a real email you can access (e.g., `testuser@example.com`)
   - **Password:** Must meet all requirements:
     - At least 8 characters
     - One uppercase letter (A-Z)
     - One lowercase letter (a-z)
     - One number (0-9)
     - One special character (!@#$%^&*...)
     - Example: `Test123!@#`
   - **Confirm Password:** Same as password

3. Click "Create Account"

4. **Expected Result:**
   - ✅ Success message: "Account created successfully!"
   - ✅ Message: "We've sent a verification email to [your email]"
   - ✅ Automatically redirects to `/auth/verify-email?email=[your email]`

5. **Check Browser Console (F12):**
   - Should see: "User created: [userId]"
   - Should see: "Verification email sent via Brevo"

6. **Check Network Tab:**
   - POST request to `/api/auth/send-verification-email` should succeed (200)

---

### ✅ Step 2: Email Verification

1. **Check Your Email Inbox:**
   - Look for email from Care Haven (via Brevo)
   - Check spam folder if not in inbox
   - Subject should be about email verification

2. **Click the verification link** in the email

3. **Expected Result:**
   - ✅ Redirects to `/api/auth/verify-email?token=[token]&email=[email]`
   - ✅ Then redirects to `/auth/signin?verified=true`
   - ✅ Sign-in page shows: "Email verified successfully! You can now sign in."

4. **Verify in Supabase Dashboard** (optional):
   - Go to Authentication → Users
   - Find your user
   - Check that `email_confirmed_at` is now set (not null)

---

### ✅ Step 3: User Login

1. On the sign-in page (`http://localhost:3000/auth/signin`), enter:
   - **Email:** The email you used for sign up
   - **Password:** The password you used for sign up

2. Optionally check "Remember me"

3. Click "Sign In"

4. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Redirects to `/auth/callback?next=/patient`
   - ✅ Then redirects to `/patient` dashboard (or `/complete-profile` if profile not complete)

5. **Check Browser Console (F12):**
   - Should see: "✅ Server-side sign-in successful"
   - Should see: "🍪 Current cookies after sign-in: [cookies]"
   - Should see: "🔄 Redirecting to callback: /auth/callback?next=/patient"

6. **Check Network Tab:**
   - POST request to `/api/auth/signin` should succeed (200)
   - Response should contain: `{ success: true, user: { id, email, email_confirmed: true } }`

7. **Check Cookies (DevTools → Application → Cookies):**
   - Should see: `sb-[project-ref]-auth-token` cookie
   - Should see: `auth-debug` cookie

---

### ✅ Step 4: Dashboard Access

1. **After successful login**, you should be redirected to:
   - `/patient` dashboard (for regular users)
   - `/complete-profile` (if profile is not completed)

2. **If redirected to `/complete-profile`:**
   - Fill in required profile information
   - Submit the form
   - You'll be redirected to `/patient` dashboard

3. **Dashboard Should Show:**
   - ✅ Header with navigation
   - ✅ Sidebar with menu items
   - ✅ Dashboard content with:
     - Patient Demographics
     - Metric Cards (Total Consultations, Upcoming Appointments, Investigations)
     - Upcoming Appointments list (if any)

4. **Verify No Redirects:**
   - ✅ Should NOT redirect to `/auth/signin`
   - ✅ Should NOT redirect to `/complete-profile` (if already completed)
   - ✅ URL should stay at `/patient` (or other dashboard route)

5. **Test Navigation:**
   - Click around the dashboard
   - Verify you stay authenticated
   - No unexpected logouts

---

## Troubleshooting Common Issues

### ❌ Sign Up Issues

**Problem:** Email not sending
- **Solution:** Check Brevo API configuration in `.env` file
- Check browser console for errors in `/api/auth/send-verification-email`

**Problem:** "User already exists" error
- **Solution:** Use a different email or delete the user from Supabase dashboard

**Problem:** Password validation errors
- **Solution:** Make sure password meets all 5 requirements shown in the form

---

### ❌ Email Verification Issues

**Problem:** Verification link not working
- **Solution:** 
  - Check token validation in `/api/auth/verify-email`
  - Verify token hasn't expired (check `email_verification_tokens` table)
  - Check Supabase admin API permissions

**Problem:** Email not arriving
- **Solution:**
  - Check spam folder
  - Verify Brevo email service is configured correctly
  - Check Brevo dashboard for email logs
  - Use a test email service like Mailtrap for development

**Problem:** "Verification failed" error
- **Solution:**
  - Check if token is valid and not expired
  - Verify database connection
  - Check Supabase admin API has proper permissions

---

### ❌ Login Issues

**Problem:** "Invalid email or password"
- **Solution:**
  - Verify email is correct
  - Verify password is correct
  - Make sure email is verified (check Supabase dashboard)

**Problem:** "Email not confirmed" error
- **Solution:**
  - Verify email was verified (check `email_confirmed_at` in Supabase)
  - Check if verification token was marked as used in database
  - Try clicking verification link again or resend verification email

**Problem:** Cookies not being set
- **Solution:**
  - Check browser console for cookie-related errors
  - Verify SameSite cookie settings
  - Check if cookies are blocked by browser
  - Try in incognito/private mode

**Problem:** Redirects to sign-in immediately after login
- **Solution:**
  - Check if session is being created in Supabase
  - Verify middleware is not blocking authenticated users
  - Check browser cookies are being set
  - Clear browser cache and cookies, try again

---

### ❌ Dashboard Access Issues

**Problem:** Redirected to `/complete-profile`
- **Solution:** 
  - This is expected if profile is incomplete
  - Fill in profile information and submit
  - Profile will be marked as complete

**Problem:** Redirected to `/auth/signin` from dashboard
- **Solution:**
  - Check if session is valid in Supabase
  - Verify cookies are set correctly
  - Check middleware authentication logic
  - Try logging in again

**Problem:** Wrong dashboard displayed
- **Solution:**
  - Check user role in `profiles` table (should be 'patient' for regular users)
  - Verify role-based routing logic in `/auth/callback`
  - Check dashboard layout role detection

---

## Success Criteria

### ✅ Sign Up Flow
- [ ] Can access sign-up page
- [ ] Form validates all fields correctly
- [ ] Account is created in Supabase
- [ ] Verification email is sent
- [ ] Redirects to verification page with success message

### ✅ Email Verification Flow
- [ ] Verification email arrives in inbox
- [ ] Verification link works
- [ ] Email is marked as verified in Supabase
- [ ] Redirects to sign-in with success message

### ✅ Login Flow
- [ ] Can access sign-in page
- [ ] Login with correct credentials succeeds
- [ ] Session is created in Supabase
- [ ] Cookies are set correctly
- [ ] Redirects to callback route

### ✅ Dashboard Access Flow
- [ ] Callback route processes authentication correctly
- [ ] Profile is created/updated as needed
- [ ] Redirects to appropriate dashboard based on role
- [ ] Dashboard displays correctly
- [ ] No unexpected redirects
- [ ] User stays authenticated during navigation

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Document any issues found
2. ✅ Test edge cases (wrong password, expired tokens, etc.)
3. ✅ Test with different browsers
4. ✅ Test on mobile devices (if applicable)
5. ✅ Proceed to next user story

---

## Quick Reference URLs

- Sign Up: `http://localhost:3000/auth/signup`
- Sign In: `http://localhost:3000/auth/signin`
- Verify Email: `http://localhost:3000/auth/verify-email`
- Patient Dashboard: `http://localhost:3000/patient`
- Complete Profile: `http://localhost:3000/complete-profile`

---

## Notes

- Use a real email address you can access for testing
- Keep test credentials safe and delete test accounts after testing
- Check browser console and network tab for debugging
- Supabase dashboard is helpful for verifying database state
