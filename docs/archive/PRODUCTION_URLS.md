# Production URLs - CareHaven

**Production Domain:** `https://your-domain.com`

## 🔐 Authentication URLs

### Patient/General Login
- **Sign In:** `https://your-domain.com/auth/signin`
- **Sign Up:** `https://your-domain.com/auth/signup`
- **Email Verification:** `https://your-domain.com/auth/verify-email`
- **Forgot Password:** `https://your-domain.com/auth/forgot-password`
- **Reset Password:** `https://your-domain.com/auth/reset-password`

### Doctor Authentication
- **Doctor Login:** `https://your-domain.com/doctor/login`
- **Doctor Sign In (Alternative):** `https://your-domain.com/auth/signin`

### Admin Authentication
- **Admin Login:** `https://your-domain.com/admin/login`

## 📝 Enrollment URLs

### Doctor Enrollment
- **Doctor Enrollment (Primary):** `https://your-domain.com/doctor-enrollment`
- **Doctor Enrollment (Redirect):** `https://your-domain.com/doctor/enrollment` → Redirects to `/doctor-enrollment`

## 🏠 Dashboard URLs

### Patient Dashboard
- **Patient Dashboard:** `https://your-domain.com/patient`
- **Patient Appointments:** `https://your-domain.com/patient/appointments`
- **Patient Profile:** `https://your-domain.com/patient/profile`
- **Patient Settings:** `https://your-domain.com/patient/settings`

### Doctor Dashboard
- **Doctor Dashboard:** `https://your-domain.com/doctor/dashboard`
- **Doctor Appointments:** `https://your-domain.com/doctor/appointments`
- **Doctor Sessions:** `https://your-domain.com/doctor/sessions`
- **Doctor Profile:** `https://your-domain.com/doctor/profile`

### Admin Dashboard
- **Admin Dashboard:** `https://your-domain.com/admin/dashboard`
- **Admin Analytics:** `https://your-domain.com/admin/analytics`
- **Admin Settings:** `https://your-domain.com/admin/settings`

## 🔗 Quick Access Links

### For Patients
- Login: `https://your-domain.com/auth/signin`
- Sign Up: `https://your-domain.com/auth/signup`
- Dashboard: `https://your-domain.com/patient`

### For Doctors
- Login: `https://your-domain.com/doctor/login`
- Enrollment: `https://your-domain.com/doctor-enrollment`
- Dashboard: `https://your-domain.com/doctor/dashboard`

### For Admins
- Login: `https://your-domain.com/admin/login`
- Dashboard: `https://your-domain.com/admin/dashboard`

## 🌐 Public Pages

- **Homepage:** `https://your-domain.com/`
- **How It Works:** `https://your-domain.com/how-it-works`
- **Privacy Policy:** `https://your-domain.com/privacy-policy`
- **Terms of Service:** `https://your-domain.com/terms-of-service`
- **Support:** `https://your-domain.com/support`

## 🔧 API Endpoints (Production)

### Authentication APIs
- `POST https://your-domain.com/api/auth/signin` - Sign in
- `POST https://your-domain.com/api/auth/signup` - Sign up
- `POST https://your-domain.com/api/auth/send-verification-code` - Send verification code
- `POST https://your-domain.com/api/auth/verify-code` - Verify code
- `GET https://your-domain.com/api/auth/redirect` - Role-based redirect

### Debug/Testing
- `GET https://your-domain.com/api/debug/email-config` - Check email configuration

## 📋 Netlify Information

- **Netlify Project:** carehavenapp
- **Netlify Admin URL:** `https://app.netlify.com/projects/carehavenapp`
- **Production Site:** `https://your-domain.com`

## 🔐 Environment Variables (Set in Netlify)

The following environment variables are configured in Netlify Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
BREVO_API_KEY=your-brevo-api-key
```

## 📝 Notes

1. All URLs use HTTPS (required for production)
2. The domain `your-domain.com` is the official production domain
3. `/doctor/enrollment` automatically redirects to `/doctor-enrollment`
4. All authentication routes redirect authenticated users to their appropriate dashboards
5. Email verification uses 6-digit codes sent via Brevo email service

## 🔄 Redirect Flows

### After Sign-In
1. User signs in → `https://your-domain.com/auth/signin`
2. Redirects to → `https://your-domain.com/auth/callback`
3. Role-based redirect:
   - Patient → `https://your-domain.com/patient`
   - Doctor → `https://your-domain.com/doctor/dashboard`
   - Admin → `https://your-domain.com/admin/dashboard`

### After Enrollment
1. Doctor enrolls → `https://your-domain.com/doctor-enrollment`
2. Redirects to → `https://your-domain.com/auth/verify-email?email={email}`
3. After verification → `https://your-domain.com/doctor/dashboard`
