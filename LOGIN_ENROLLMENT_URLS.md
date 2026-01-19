# Login and Enrollment URLs Reference

This document provides a comprehensive list of all authentication and enrollment URLs in the CareHaven application.

## 🔐 Authentication URLs

### Patient/General Authentication

| URL | Purpose | Access | Redirects To |
|-----|---------|--------|--------------|
| `/auth/signin` | Main sign-in page for patients | Public | Role-based dashboard after login |
| `/auth/signup` | Patient registration | Public | `/auth/verify-email` |
| `/auth/verify-email` | Email verification page | Public | Dashboard after verification |
| `/auth/forgot-password` | Password reset request | Public | `/auth/reset-password` |
| `/auth/reset-password` | Password reset form | Public | `/auth/signin` after reset |
| `/auth/callback` | OAuth/magic link callback | Public | Role-based dashboard |

### Doctor Authentication

| URL | Purpose | Access | Redirects To |
|-----|---------|--------|--------------|
| `/doctor/login` | Doctor-specific sign-in | Public | `/doctor/dashboard` |

### Admin Authentication

| URL | Purpose | Access | Redirects To |
|-----|---------|--------|--------------|
| `/admin/login` | Admin sign-in page | Public | `/admin/dashboard` |

## 📝 Enrollment URLs

### Doctor Enrollment

| URL | Purpose | Access | Notes |
|-----|---------|--------|-------|
| `/doctor-enrollment` | Public doctor enrollment form | **Public** | ✅ Primary enrollment route - use this one |
| `/doctor/enrollment` | Redirect to `/doctor-enrollment` | **Public** | ✅ Redirects to `/doctor-enrollment` for backward compatibility |

✅ **Fixed**: Both routes now point to the same public enrollment form. `/doctor/enrollment` automatically redirects to `/doctor-enrollment`.

## 🔄 Redirect Flow

### After Sign-In
1. User signs in → `/auth/signin`
2. Session created → `/auth/callback?next={redirectPath}`
3. Profile checked → Role-based redirect:
   - Patient → `/patient`
   - Doctor → `/doctor/dashboard`
   - Admin → `/admin/dashboard`
   - Super Admin → `/admin/dashboard`

### After Sign-Up
1. User signs up → `/auth/signup`
2. Account created → `/auth/verify-email?email={email}`
3. Email verified → Role-based dashboard

### After Enrollment
1. Doctor enrolls → `/doctor-enrollment`
2. Account created → `/auth/verify-email?email={email}`
3. Email verified → `/doctor/dashboard` (after profile completion)

## 🛡️ Middleware Protection

### Public Routes (No Auth Required)
- `/` (homepage)
- `/about`
- `/contact`
- `/pricing`
- `/doctor-enrollment` ✅
- `/doctor/enrollment` ✅ (redirects to `/doctor-enrollment`)
- `/privacy-policy`
- `/terms-of-service`
- `/support`
- `/how-it-works`

### Auth Routes (No Auth Required, but redirect if authenticated)
- `/auth/signin`
- `/auth/signup`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/callback`
- `/admin/login`
- `/doctor/login`

### Protected Routes (Auth Required)
- All `/patient/*` routes
- All `/doctor/*` routes (except `/doctor/login` and `/doctor/enrollment` which redirects)
- All `/admin/*` routes (except `/admin/login`)

## 🔧 API Endpoints

### Authentication APIs
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/send-verification-email` - Send verification email
- `POST /api/auth/send-verification-code` - Send 6-digit verification code
- `POST /api/auth/verify-code` - Verify 6-digit code
- `GET /api/auth/verify-email` - Verify email token
- `GET /api/auth/redirect` - Role-based redirect helper
- `POST /api/auth/auto-signin` - Auto sign-in helper

## ✅ Recent Fixes Applied

### ✅ Fixed: Duplicate Enrollment Routes
**Solution Applied**: 
1. ✅ Updated `/doctor/enrollment` to redirect to `/doctor-enrollment`
2. ✅ Removed `/doctor/enrollment` from `authRoutes` in middleware
3. ✅ Updated doctor signin form to link to `/doctor-enrollment`
4. ✅ Both routes now work consistently - `/doctor/enrollment` redirects to `/doctor-enrollment`

**Result**: Single source of truth for doctor enrollment at `/doctor-enrollment`

## ✅ Quick Reference

### For Patients
- Sign up: `/auth/signup`
- Sign in: `/auth/signin`
- Verify email: `/auth/verify-email`
- Reset password: `/auth/reset-password`

### For Doctors
- Sign in: `/doctor/login` or `/auth/signin`
- Enroll: `/doctor-enrollment` ✅ (primary route)
- Dashboard: `/doctor/dashboard`

### For Admins
- Sign in: `/admin/login`
- Dashboard: `/admin/dashboard`

## 🔗 URL Parameters

### Sign-In Redirect
- `?redirect={path}` - Redirect to this path after successful sign-in

### Email Verification
- `?email={email}` - Pre-fill email address
- `?admin=true` - Admin verification flow

### Password Reset
- `?token={token}` - Password reset token
- `?passwordReset=true` - Show success message
