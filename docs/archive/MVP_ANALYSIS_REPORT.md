# Care Haven - MVP Analysis & Completion Plan

**Date:** January 2025  
**Project:** Telemedicine Platform  
**Status:** Partially Implemented - Critical Development Issues

---

## 1. PRODUCT DISCOVERY FROM CODE

### Application Purpose
**Care Haven** is a comprehensive telemedicine platform designed to connect patients with licensed healthcare professionals via secure video consultations. The platform serves the **healthcare/telemedicine domain** with features for:

- Secure video consultations (HIPAA-compliant via Daily.co)
- Appointment booking and management
- Electronic prescriptions
- Lab investigation requests
- Real-time messaging between patients and doctors
- Payment processing (Paystack - Nigerian Naira)
- Email/SMS notifications (Brevo/Twilio)

### Core User Flows Identified

1. **Patient Flow:**
   - Sign in with Google OAuth → Complete profile → Browse/book appointments → Pay → Join video call → View prescriptions/investigations → Access session notes

2. **Doctor Flow:**
   - Sign in with Google OAuth → Complete profile (with license verification) → View appointments → Conduct consultations → Create SOAP notes → Prescribe medications → Request investigations

3. **Admin Flow:**
   - (Not fully implemented - role exists in schema but no admin UI)

### Major Features Intended

✅ **Implemented:**
- Google OAuth authentication (`app/auth/signin/page.tsx`, `app/auth/callback/route.ts`)
- Profile completion flow (`app/complete-profile/page.tsx`)
- Patient & Doctor dashboards (`app/(dashboard)/patient/page.tsx`, `app/(dashboard)/doctor/page.tsx`)
- Appointment booking form (`components/patient/book-appointment-form.tsx`)
- Database schema with RLS policies (`supabase/migrations/`)
- Payment initialization/verification APIs (`app/api/payments/`)
- Daily.co video room creation (`app/api/daily/create-room/route.ts`)
- SOAP notes form (`components/consultation/soap-form.tsx`)
- React Query setup for data fetching (`lib/react-query/`)

❌ **Incomplete/Broken:**
- Doctor selection in booking flow (form requires `doctor_id` but no UI to select)
- Payment callback handler (referenced but missing)
- Video call interface integration (component exists but not connected to appointments)
- Real-time messaging UI (hooks exist but no UI)
- Notification system UI (bell component exists but not functional)
- Prescription creation from SOAP notes
- Investigation request creation
- Doctor availability management
- Profile fields: `occupation`, `marital_status` referenced but not in schema

---

## 2. CURRENT STATE AUDIT

### Implemented Features (with file paths)

| Feature | Status | Files |
|---------|--------|-------|
| **Authentication** | ✅ Complete | `app/auth/signin/page.tsx`, `app/auth/callback/route.ts`, `components/auth/google-signin-button.tsx` |
| **Profile Management** | ✅ Mostly Complete | `app/complete-profile/page.tsx`, `components/auth/complete-profile-form.tsx`, `components/patient/profile-form.tsx` |
| **Database Schema** | ✅ Complete | `supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql`, `003_indexes.sql`, `004_audit_logging.sql`, `005_realtime_setup.sql` |
| **Patient Dashboard** | ✅ Complete | `app/(dashboard)/patient/page.tsx`, `components/patient/metric-card.tsx` |
| **Doctor Dashboard** | ✅ Complete | `app/(dashboard)/doctor/page.tsx` |
| **Appointment Listing** | ✅ Complete | `app/(dashboard)/patient/appointments/page.tsx`, `components/patient/appointment-card.tsx` |
| **Appointment Booking Form** | ⚠️ Incomplete | `components/patient/book-appointment-form.tsx` (missing doctor selection) |
| **Payment APIs** | ✅ Complete | `app/api/payments/initialize/route.ts`, `app/api/payments/verify/route.ts`, `lib/paystack/client.ts` |
| **Video Room Creation** | ✅ Complete | `app/api/daily/create-room/route.ts`, `app/api/daily/get-token/route.ts`, `lib/daily/client.ts` |
| **Video Call Interface** | ✅ Component Exists | `components/video/call-interface.tsx` (not integrated) |
| **SOAP Notes Form** | ⚠️ Incomplete | `components/consultation/soap-form.tsx` (form fields duplicated, no prescription integration) |
| **Session Notes View** | ✅ Complete | `app/(dashboard)/patient/sessions/page.tsx`, `app/(dashboard)/doctor/sessions/page.tsx` |
| **Email/SMS Clients** | ✅ Complete | `lib/email/client.ts`, `lib/sms/client.ts` |
| **React Query Setup** | ✅ Complete | `lib/react-query/provider.tsx`, `lib/react-query/queries.ts`, `lib/react-query/mutations.ts` |

### Incomplete/Broken Features (with file paths and issues)

| Feature | Issue | Files | Error Details |
|---------|-------|-------|---------------|
| **Development Server** | 🔴 CRITICAL | `middleware.ts` | Edge Runtime `EvalError` - all pages return 500 in dev (production works) |
| **Doctor Selection** | ❌ Missing | `components/patient/book-appointment-form.tsx` | Form requires `doctor_id` UUID but no UI to browse/select doctors |
| **Payment Callback** | ❌ Missing | Referenced in `lib/paystack/client.ts:12` | `NEXT_PUBLIC_APP_URL/payment/callback` route doesn't exist |
| **Video Call Integration** | ❌ Not Connected | `components/video/call-interface.tsx` | Component exists but not used in appointment flow |
| **Prescription Creation** | ❌ Missing | `components/consultation/soap-form.tsx` | SOAP form has prescription textarea but no actual prescription table insert |
| **Investigation Requests** | ❌ Missing | `app/(dashboard)/patient/investigations/page.tsx` | Page exists but no form to create investigations |
| **Real-time Messaging UI** | ❌ Missing | `hooks/use-realtime-messages.ts` | Hook exists but no UI component |
| **Notifications UI** | ❌ Incomplete | `components/notifications/notification-bell.tsx` | Component exists but not functional |
| **Doctor Availability** | ❌ Missing | Schema exists but no UI | No interface for doctors to set availability |
| **Profile Schema Mismatch** | ⚠️ Data Issue | Multiple files | `occupation`, `marital_status` used in UI but not in database schema |
| **Appointment Amount** | ❌ Missing | `components/patient/book-appointment-form.tsx` | No field to set consultation fee, payment flow incomplete |

### Tech Stack

**Frontend:**
- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5.9.3
- Tailwind CSS 4
- shadcn/ui components
- React Hook Form + Zod validation
- TanStack React Query
- Zustand (state management)

**Backend:**
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Next.js API Routes (Server Actions)

**Third-Party Services:**
- Daily.co (video consultations)
- Paystack (payments - NGN)
- Brevo (email)
- Twilio (SMS)
- Google OAuth (authentication)

**Deployment:**
- Netlify (configured, working in production)

### Configuration Gaps

**Environment Variables Required:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Daily.co
DAILY_CO_API_KEY
NEXT_PUBLIC_DAILY_CO_API_KEY

# Paystack
PAYSTACK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
NEXT_PUBLIC_APP_URL  # Missing - needed for payment callback

# Brevo
BREVO_API_KEY

# Twilio
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

**Missing Files:**
- `.env.local` or `.env.example` (no template file)
- Payment callback route (`app/payment/callback/route.ts`)
- Doctor selection/browsing page

**Database Issues:**
- `profiles` table missing `occupation` and `marital_status` columns (referenced in UI)
- No seed data or migration for doctor availability

---

## 3. HOLISTIC MVP GAP ANALYSIS

### Missing for Fully Working Prototype

#### Critical Gaps (Block MVP):

1. **Development Environment Broken**
   - **Issue:** Middleware causes Edge Runtime `EvalError` in development
   - **Impact:** Cannot test locally, all pages return 500
   - **Fix:** Remove or fix middleware, use route-level auth checks

2. **Incomplete Appointment Booking Flow**
   - **Missing:** Doctor selection UI
   - **Missing:** Appointment amount/fee setting
   - **Missing:** Payment integration in booking flow
   - **Impact:** Users cannot complete booking end-to-end

3. **Payment Callback Missing**
   - **Missing:** `/payment/callback` route
   - **Impact:** Payment verification doesn't complete, appointments stuck in "pending"

4. **Video Call Not Integrated**
   - **Missing:** Connection between appointments and video calls
   - **Missing:** Room creation trigger on appointment confirmation
   - **Impact:** Users cannot join video consultations

5. **Prescription System Incomplete**
   - **Missing:** Actual prescription creation from SOAP notes
   - **Missing:** Prescription display for patients
   - **Impact:** Doctors cannot prescribe medications

#### Important Gaps (Affect UX):

6. **Profile Schema Mismatch**
   - **Issue:** UI references `occupation`, `marital_status` but columns don't exist
   - **Impact:** Form submission will fail, data loss

7. **Investigation Requests**
   - **Missing:** UI to create investigation requests
   - **Impact:** Doctors cannot request lab tests

8. **Real-time Features Not Connected**
   - **Missing:** Messaging UI
   - **Missing:** Notification bell functionality
   - **Impact:** No real-time communication

9. **Doctor Availability**
   - **Missing:** UI to manage availability
   - **Impact:** No way to show available time slots

### Critical Data Models & Relationships

**✅ Well Defined:**
- `profiles` → `appointments` (patient_id, doctor_id)
- `appointments` → `consultation_notes` (appointment_id)
- `appointments` → `prescriptions` (appointment_id)
- `appointments` → `investigations` (appointment_id)
- `profiles` → `notifications` (user_id)
- `profiles` → `messages` (sender_id, receiver_id)

**⚠️ Missing Relationships:**
- No foreign key from `prescriptions` to `consultation_notes`
- No relationship between `doctor_availability` and appointment booking logic

### Authentication & Authorization Gaps

**✅ Implemented:**
- Google OAuth flow
- Profile creation on first sign-in
- RLS policies for all tables
- Role-based access (patient/doctor)

**❌ Missing:**
- Middleware auth check (disabled due to Edge Runtime error)
- Route-level protection (relying on server component redirects)
- Session refresh handling
- Admin role implementation

### Real-time & Third-Party Integration Gaps

**✅ Configured:**
- Supabase Realtime enabled for appointments, notifications, messages
- Daily.co API client
- Paystack API client
- Brevo email client
- Twilio SMS client

**❌ Not Integrated:**
- Realtime subscriptions not used in UI
- Video room creation not triggered automatically
- Payment webhook not configured
- Email/SMS notifications not sent on events
- No error handling for API failures

---

## 4. PRIORITIZED ACTION PLAN

### Phase 1: Fix Critical Development Issues (Priority 1)

#### Task 1.1: Fix Development Server
**Purpose:** Enable local development and testing

**Files to Edit:**
- `middleware.ts` - Remove or simplify to avoid Edge Runtime issues
- `app/(dashboard)/layout.tsx` - Add auth check here instead

**Changes:**
```typescript
// middleware.ts - Remove entirely or make minimal
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// app/(dashboard)/layout.tsx - Add auth check
export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  // ... rest of layout
}
```

**Dependencies:** None (blocks everything else)

---

#### Task 1.2: Create Environment Variables Template
**Purpose:** Document required environment variables

**Files to Create:**
- `.env.example` - Template with all required variables

**Content:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Daily.co
DAILY_CO_API_KEY=
NEXT_PUBLIC_DAILY_CO_API_KEY=

# Paystack
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Brevo
BREVO_API_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

**Dependencies:** None

---

### Phase 2: Fix Database Schema Issues (Priority 2)

#### Task 2.1: Add Missing Profile Columns
**Purpose:** Fix schema mismatch with UI

**Files to Create:**
- `supabase/migrations/006_add_profile_fields.sql`

**Content:**
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT;
```

**Dependencies:** None

---

### Phase 3: Complete Appointment Booking Flow (Priority 3)

#### Task 3.1: Create Doctor Selection/Browsing
**Purpose:** Allow patients to select doctors before booking

**Files to Create:**
- `app/(dashboard)/patient/appointments/select-doctor/page.tsx`
- `components/patient/doctor-list.tsx`
- `components/patient/doctor-card.tsx`

**Files to Edit:**
- `components/patient/book-appointment-form.tsx` - Add doctor selection step or redirect

**Code Snippet:**
```typescript
// components/patient/doctor-list.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function DoctorList() {
  const supabase = createClient()
  
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('license_verified', true)
      return data
    }
  })
  
  // Render doctor cards with selection
}
```

**Dependencies:** Task 2.1 (schema fix)

---

#### Task 3.2: Add Appointment Amount to Booking Form
**Purpose:** Set consultation fee when booking

**Files to Edit:**
- `components/patient/book-appointment-form.tsx`

**Changes:**
- Fetch doctor's `consultation_fee` when doctor is selected
- Display amount in form
- Include `amount` in appointment creation

**Dependencies:** Task 3.1

---

#### Task 3.3: Integrate Payment in Booking Flow
**Purpose:** Complete payment flow after booking

**Files to Edit:**
- `components/patient/book-appointment-form.tsx`

**Changes:**
- After appointment creation, redirect to payment
- Call `/api/payments/initialize`
- Redirect to Paystack payment page
- Handle callback

**Dependencies:** Task 3.2, Task 4.1

---

### Phase 4: Payment System Completion (Priority 4)

#### Task 4.1: Create Payment Callback Route
**Purpose:** Handle Paystack payment verification

**Files to Create:**
- `app/payment/callback/route.ts`

**Code:**
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/paystack/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  
  if (!reference) {
    return NextResponse.redirect('/patient/appointments?error=payment_failed')
  }
  
  try {
    const payment = await verifyPayment(reference)
    
    if (payment.data.status === 'success') {
      const supabase = await createClient()
      
      await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
        })
        .eq('paystack_reference', reference)
      
      return NextResponse.redirect('/patient/appointments?success=payment_complete')
    }
  } catch (error) {
    console.error('Payment verification error:', error)
  }
  
  return NextResponse.redirect('/patient/appointments?error=payment_failed')
}
```

**Dependencies:** None

---

### Phase 5: Video Call Integration (Priority 5)

#### Task 5.1: Create Video Call Page
**Purpose:** Allow users to join video consultations

**Files to Create:**
- `app/(dashboard)/patient/appointments/[id]/join/page.tsx`
- `app/(dashboard)/doctor/appointments/[id]/join/page.tsx`

**Files to Edit:**
- `components/patient/appointment-card.tsx` - Add "Join Call" button for confirmed appointments

**Code Snippet:**
```typescript
// app/(dashboard)/patient/appointments/[id]/join/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CallInterface } from '@/components/video/call-interface'

export default function JoinCallPage() {
  const params = useParams()
  const [token, setToken] = useState<string | null>(null)
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  
  useEffect(() => {
    // Fetch appointment, create room if needed, get token
    // ... implementation
  }, [])
  
  if (!token || !roomUrl) return <div>Loading...</div>
  
  return <CallInterface roomUrl={roomUrl} token={token} onLeave={() => router.push('/patient/appointments')} />
}
```

**Dependencies:** Task 3.3 (payment flow)

---

#### Task 5.2: Auto-create Video Room on Confirmation
**Purpose:** Automatically create Daily.co room when appointment is confirmed

**Files to Create:**
- `app/api/appointments/[id]/create-room/route.ts` (or use existing)

**Files to Edit:**
- `app/api/payments/verify/route.ts` - After payment success, create room

**Dependencies:** Task 4.1

---

### Phase 6: Prescription System (Priority 6)

#### Task 6.1: Create Prescription from SOAP Notes
**Purpose:** Allow doctors to create prescriptions

**Files to Edit:**
- `components/consultation/soap-form.tsx`

**Changes:**
- Add prescription medication fields (name, dosage, frequency, duration)
- On submit, create entry in `prescriptions` table
- Link to `appointment_id` and `consultation_notes`

**Dependencies:** Task 5.1 (video call)

---

#### Task 6.2: Display Prescriptions for Patients
**Purpose:** Show prescriptions in patient dashboard

**Files to Edit:**
- `app/(dashboard)/patient/prescriptions/page.tsx` (create if missing)
- `components/patient/prescription-card.tsx` (create)

**Dependencies:** Task 6.1

---

### Phase 7: Investigation Requests (Priority 7)

#### Task 7.1: Create Investigation Request UI
**Purpose:** Allow doctors to request lab tests

**Files to Create:**
- `components/doctor/investigation-request-form.tsx`

**Files to Edit:**
- `app/(dashboard)/doctor/appointments/[id]/page.tsx` (create appointment detail page)

**Dependencies:** Task 5.1

---

#### Task 7.2: Display Investigations for Patients
**Purpose:** Show investigation requests and results

**Files to Edit:**
- `app/(dashboard)/patient/investigations/page.tsx` - Add create/display functionality

**Dependencies:** Task 7.1

---

### Phase 8: Real-time Features (Priority 8)

#### Task 8.1: Implement Messaging UI
**Purpose:** Enable real-time messaging

**Files to Create:**
- `app/(dashboard)/messages/page.tsx`
- `components/messages/message-list.tsx`
- `components/messages/message-input.tsx`

**Files to Edit:**
- `hooks/use-realtime-messages.ts` - Connect to UI

**Dependencies:** None

---

#### Task 8.2: Implement Notification Bell
**Purpose:** Show real-time notifications

**Files to Edit:**
- `components/notifications/notification-bell.tsx` - Connect to Supabase Realtime
- `app/(dashboard)/patient/notifications/page.tsx` (create)

**Dependencies:** None

---

### Phase 9: Doctor Features (Priority 9)

#### Task 9.1: Doctor Availability Management
**Purpose:** Allow doctors to set available time slots

**Files to Create:**
- `app/(dashboard)/doctor/availability/page.tsx`
- `components/doctor/availability-form.tsx`

**Dependencies:** None

---

#### Task 9.2: Appointment Detail Page for Doctors
**Purpose:** Allow doctors to view appointment details and create SOAP notes

**Files to Create:**
- `app/(dashboard)/doctor/appointments/[id]/page.tsx`

**Dependencies:** Task 5.1

---

## 5. IMMEDIATE NEXT STEPS

### Step 1: Fix Development Environment (15 minutes)

**Commands:**
```bash
# 1. Simplify middleware to avoid Edge Runtime issues
# Edit middleware.ts to be minimal or remove it

# 2. Add auth check to dashboard layout instead
# Edit app/(dashboard)/layout.tsx

# 3. Clear build cache and restart
rm -rf .next
npm run dev
```

**Expected Result:** Development server runs without 500 errors

---

### Step 2: Create Environment Variables File (5 minutes)

**Commands:**
```bash
# Create .env.local from template
cp .env.example .env.local  # (after creating .env.example)

# Or manually create .env.local with values from NETLIFY_ENV_MANUAL.md
```

**Expected Result:** All environment variables configured locally

---

### Step 3: Fix Database Schema (10 minutes)

**Commands:**
```bash
# 1. Create migration file
# Create supabase/migrations/006_add_profile_fields.sql

# 2. Run migration in Supabase dashboard
# Or via Supabase CLI: supabase migration up
```

**Expected Result:** `occupation` and `marital_status` columns added to profiles table

---

### Verification Commands

After completing steps 1-3, verify:

```bash
# 1. Start dev server
npm run dev

# 2. Test homepage (should load)
curl http://localhost:3000

# 3. Test auth page (should load)
curl http://localhost:3000/auth/signin

# 4. Check database schema
# In Supabase dashboard, verify profiles table has new columns
```

---

## SUMMARY

**Current Status:** ~60% Complete
- ✅ Core infrastructure (auth, database, APIs)
- ✅ Basic UI components
- ❌ Critical flows incomplete (booking, payment, video)
- 🔴 Development environment broken

**Estimated Time to MVP:** 20-30 hours of focused development

**Critical Path:**
1. Fix dev environment (blocks everything)
2. Complete appointment booking (core feature)
3. Integrate payment (revenue)
4. Connect video calls (core value prop)
5. Prescription system (completes consultation)

**Risk Areas:**
- Middleware Edge Runtime issue (may need Next.js version change)
- Payment callback security (webhook verification)
- Video call room management (expiration, cleanup)
- Real-time subscription performance (scaling)

---

**Next Action:** Start with Step 1 (fix development environment) to unblock all other work.

