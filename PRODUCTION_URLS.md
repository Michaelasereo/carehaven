# Production URLs - CareHaven

**Production Domain:** `https://carehaven.app`

## 🔐 Authentication URLs

### Patient/General Login
- **Sign In:** `https://carehaven.app/auth/signin`
- **Sign Up:** `https://carehaven.app/auth/signup`
- **Email Verification:** `https://carehaven.app/auth/verify-email`
- **Forgot Password:** `https://carehaven.app/auth/forgot-password`
- **Reset Password:** `https://carehaven.app/auth/reset-password`

### Doctor Authentication
- **Doctor Login:** `https://carehaven.app/doctor/login`
- **Doctor Sign In (Alternative):** `https://carehaven.app/auth/signin`

### Admin Authentication
- **Admin Login:** `https://carehaven.app/admin/login`

## 📝 Enrollment URLs

### Doctor Enrollment
- **Doctor Enrollment (Primary):** `https://carehaven.app/doctor-enrollment`
- **Doctor Enrollment (Redirect):** `https://carehaven.app/doctor/enrollment` → Redirects to `/doctor-enrollment`

## 🏠 Dashboard URLs

### Patient Dashboard
- **Patient Dashboard:** `https://carehaven.app/patient`
- **Patient Appointments:** `https://carehaven.app/patient/appointments`
- **Patient Profile:** `https://carehaven.app/patient/profile`
- **Patient Settings:** `https://carehaven.app/patient/settings`

### Doctor Dashboard
- **Doctor Dashboard:** `https://carehaven.app/doctor/dashboard`
- **Doctor Appointments:** `https://carehaven.app/doctor/appointments`
- **Doctor Sessions:** `https://carehaven.app/doctor/sessions`
- **Doctor Profile:** `https://carehaven.app/doctor/profile`

### Admin Dashboard
- **Admin Dashboard:** `https://carehaven.app/admin/dashboard`
- **Admin Analytics:** `https://carehaven.app/admin/analytics`
- **Admin Settings:** `https://carehaven.app/admin/settings`

## 🔗 Quick Access Links

### For Patients
- Login: `https://carehaven.app/auth/signin`
- Sign Up: `https://carehaven.app/auth/signup`
- Dashboard: `https://carehaven.app/patient`

### For Doctors
- Login: `https://carehaven.app/doctor/login`
- Enrollment: `https://carehaven.app/doctor-enrollment`
- Dashboard: `https://carehaven.app/doctor/dashboard`

### For Admins
- Login: `https://carehaven.app/admin/login`
- Dashboard: `https://carehaven.app/admin/dashboard`

## 🌐 Public Pages

- **Homepage:** `https://carehaven.app/`
- **How It Works:** `https://carehaven.app/how-it-works`
- **Privacy Policy:** `https://carehaven.app/privacy-policy`
- **Terms of Service:** `https://carehaven.app/terms-of-service`
- **Support:** `https://carehaven.app/support`

## 🔧 API Endpoints (Production)

### Authentication APIs
- `POST https://carehaven.app/api/auth/signin` - Sign in
- `POST https://carehaven.app/api/auth/signup` - Sign up
- `POST https://carehaven.app/api/auth/send-verification-code` - Send verification code
- `POST https://carehaven.app/api/auth/verify-code` - Verify code
- `GET https://carehaven.app/api/auth/redirect` - Role-based redirect

### Debug/Testing
- `GET https://carehaven.app/api/debug/email-config` - Check email configuration

## 📋 Netlify Information

- **Netlify Project:** carehavenapp
- **Netlify Admin URL:** `https://app.netlify.com/projects/carehavenapp`
- **Production Site:** `https://carehaven.app`

## 🔐 Environment Variables (Set in Netlify)

The following environment variables are configured in Netlify Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://carehaven.app
BREVO_API_KEY=your-brevo-api-key
```

## 📝 Notes

1. All URLs use HTTPS (required for production)
2. The domain `carehaven.app` is the official production domain
3. `/doctor/enrollment` automatically redirects to `/doctor-enrollment`
4. All authentication routes redirect authenticated users to their appropriate dashboards
5. Email verification uses 6-digit codes sent via Brevo email service

## 🔄 Redirect Flows

### After Sign-In
1. User signs in → `https://carehaven.app/auth/signin`
2. Redirects to → `https://carehaven.app/auth/callback`
3. Role-based redirect:
   - Patient → `https://carehaven.app/patient`
   - Doctor → `https://carehaven.app/doctor/dashboard`
   - Admin → `https://carehaven.app/admin/dashboard`

### After Enrollment
1. Doctor enrolls → `https://carehaven.app/doctor-enrollment`
2. Redirects to → `https://carehaven.app/auth/verify-email?email={email}`
3. After verification → `https://carehaven.app/doctor/dashboard`
