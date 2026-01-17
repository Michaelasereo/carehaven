# Doctor Dashboard Routing Documentation

## Overview

The doctor dashboard is accessible at `/doctor` and is protected by authentication middleware and role-based access control.

## Routing Flow for Doctors

### 1. Sign-In → Redirect Flow

**After successful sign-in:**
1. User signs in at `/auth/signin`
2. Server-side API (`/api/auth/signin`) authenticates and sets cookies
3. Client redirects to `/auth/callback?next=/patient`
4. Callback route (`/app/auth/callback/route.ts`) checks user role
5. **For doctors:** Redirects to `/doctor` dashboard

### 2. Role-Based Redirect Logic

**Location:** `app/auth/callback/route.ts`

```typescript
// Get user role and redirect to appropriate dashboard
const role = await getUserRole(user.id)

let redirectPath = '/patient' // default
if (role === 'doctor') {
  redirectPath = '/doctor'  // ✅ Doctors go here
} else if (role === 'admin') {
  redirectPath = '/admin'
} else if (role === 'super_admin') {
  redirectPath = '/super-admin'
} else {
  redirectPath = '/patient'
}
```

### 3. Dashboard Layout Protection

**Location:** `app/(dashboard)/layout.tsx`

The layout automatically:
- Validates session (checks cookies)
- Fetches user profile
- Checks `profile_completed` status
- Shows correct sidebar based on role:
  ```typescript
  const isDoctor = profile?.role === 'doctor'
  {isDoctor ? <DoctorSidebar /> : <Sidebar />}
  ```

### 4. Doctor Dashboard Page

**Location:** `app/(dashboard)/doctor/page.tsx`

**Features:**
- ✅ Requires authentication (redirects to sign-in if not logged in)
- ✅ Requires `role === 'doctor'` (redirects to `/patient` if not doctor)
- ✅ Displays metrics:
  - Total Consultations
  - Upcoming Appointments
  - Investigations
- ✅ Shows upcoming appointments list

**Data Fetched:**
- User profile
- Appointments (doctor's appointments, limited to 5)
- Consultation counts
- Investigation counts

## Doctor-Specific Routes

### Available Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/doctor` | Main dashboard | ✅ Implemented |
| `/doctor/sessions` | View clients/patients | ✅ Implemented |
| `/doctor/availability` | Manage availability | ✅ Implemented |
| `/doctor/appointments` | View all appointments | ✅ Implemented |
| `/doctor/profile` | Doctor profile | ✅ Implemented |
| `/doctor/settings` | Settings | ✅ Implemented |

### Sidebar Navigation

**Location:** `components/dashboard/doctor-sidebar.tsx`

**Navigation Items:**
- Dashboard (`/doctor`)
- Sessions (`/doctor/sessions`)
- Availability (`/doctor/availability`)
- Profile (`/doctor/profile`)
- Settings (`/doctor/settings`)

## Authentication Requirements

### For Doctor Dashboard Access:

1. ✅ **Valid Session** - Cookies must be set (now fixed with manual cookie setting)
2. ✅ **Email Verified** - User must have verified email
3. ✅ **Profile Complete** - `profile_completed = true` in profiles table
4. ✅ **Role = 'doctor'** - User profile must have `role = 'doctor'`

### Protection Layers

1. **Middleware** (`middleware.ts`)
   - Checks for valid session
   - Redirects unauthenticated users to `/auth/signin`

2. **Dashboard Layout** (`app/(dashboard)/layout.tsx`)
   - Server-side session validation
   - Profile completion check
   - Role-based sidebar selection

3. **Doctor Page** (`app/(dashboard)/doctor/page.tsx`)
   - Additional role check (must be `role === 'doctor'`)
   - Redirects non-doctors to `/patient`

## Cookie-Based Authentication Flow (After Fix)

### Sign-In Process:

```
1. POST /api/auth/signin
   ↓
2. Server authenticates with Supabase
   ↓
3. Server sets cookie: sb-<project-ref>-auth-token
   ↓
4. Response includes Set-Cookie header
   ↓
5. Browser stores cookie automatically
   ↓
6. Redirect to /auth/callback
   ↓
7. Callback reads cookie, validates session
   ↓
8. Redirects to /doctor (for doctors)
   ↓
9. Dashboard layout reads cookie, shows DoctorSidebar
   ↓
10. Doctor dashboard page loads ✅
```

## Testing Doctor Dashboard Access

### Test Script

```javascript
// Test doctor sign-in and dashboard access
// 1. Sign in as doctor
// 2. Verify cookie is set
// 3. Access /doctor route
// 4. Verify dashboard loads
```

### Manual Testing Steps

1. **Sign in as a doctor user:**
   ```bash
   # Use credentials for a user with role='doctor' in profiles table
   ```

2. **Check cookies in browser:**
   - Open DevTools → Application → Cookies
   - Verify `sb-<project-ref>-auth-token` exists

3. **Verify redirect:**
   - After sign-in, should redirect to `/doctor`
   - Should see DoctorSidebar (not regular Sidebar)

4. **Check dashboard access:**
   - Navigate to `/doctor`
   - Should see doctor dashboard with metrics
   - Should NOT redirect to `/auth/signin`

5. **Test role protection:**
   - If user has `role != 'doctor'`, should redirect to `/patient`
   - Even if they manually navigate to `/doctor`

## Common Issues & Solutions

### Issue: Doctor redirected to `/patient` after sign-in

**Possible Causes:**
1. Profile role is not `'doctor'`
2. Profile doesn't exist
3. Cookie not being read by callback route

**Solution:**
```sql
-- Check and fix role in database
SELECT id, email, role FROM profiles WHERE email = 'doctor@example.com';
UPDATE profiles SET role = 'doctor' WHERE email = 'doctor@example.com';
```

### Issue: Doctor dashboard shows patient sidebar

**Cause:** Dashboard layout not detecting doctor role

**Solution:** Check that profile role is correct and cookie is being read:
```typescript
// In dashboard layout, verify:
const { data: profile } = await supabase
  .from('profiles')
  .select('role, profile_completed')
  .eq('id', user.id)
  .single()

console.log('Profile role:', profile?.role) // Should be 'doctor'
```

### Issue: "Auth session missing" error

**Cause:** Cookie not being set or read properly

**Solution:** Verify cookie is in browser:
1. Check DevTools → Application → Cookies
2. Verify cookie name matches: `sb-<project-ref>-auth-token`
3. Test cookie verification: `fetch('/api/auth/verify-cookies').then(r => r.json())`

## Database Requirements

### Profiles Table Structure

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  role TEXT NOT NULL DEFAULT 'patient', -- Must be 'doctor' for doctors
  profile_completed BOOLEAN DEFAULT false, -- Must be true to access dashboard
  -- ... other fields
);

-- Example doctor profile
INSERT INTO profiles (id, email, role, profile_completed)
VALUES (
  'user-uuid',
  'doctor@example.com',
  'doctor',  -- ✅ Important: role must be 'doctor'
  true       -- ✅ Important: must be completed
);
```

## Integration with Cookie Fix

The new cookie fix ensures:

1. ✅ **Cookies are set** - `sb-<project-ref>-auth-token` cookie is manually set after sign-in
2. ✅ **Cookies are readable** - Middleware and dashboard layout can read the cookie
3. ✅ **Session persists** - Doctor stays logged in when navigating
4. ✅ **Role-based routing works** - Callback route correctly identifies doctor role and redirects to `/doctor`

## Next Steps

1. **Test with real doctor account:**
   - Sign in with a user that has `role='doctor'` in profiles
   - Verify redirect to `/doctor`
   - Verify DoctorSidebar is shown

2. **Verify all doctor routes:**
   - `/doctor` - Dashboard
   - `/doctor/sessions` - Clients
   - `/doctor/availability` - Availability
   - `/doctor/appointments` - Appointments

3. **Check cookie persistence:**
   - Sign in as doctor
   - Navigate between doctor routes
   - Verify session remains valid

4. **Test role switching:**
   - If a user's role changes from 'patient' to 'doctor'
   - Sign out and sign in again
   - Should redirect to `/doctor` instead of `/patient`
