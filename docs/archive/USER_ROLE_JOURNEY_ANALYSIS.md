# User Role Journey Analysis - Care Haven

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Analyze user journeys for each role and identify missing pages/features  
**Status:** Comprehensive Journey Mapping

---

## Table of Contents
1. [Overview](#overview)
2. [Public Visitor Journey](#public-visitor-journey)
3. [Patient Journey](#patient-journey)
4. [Doctor Journey](#doctor-journey)
5. [Admin Journey](#admin-journey)
6. [Super Admin Journey](#super-admin-journey)
7. [Missing Pages & Features](#missing-pages--features)
8. [Implementation Priority](#implementation-priority)

---

## Overview

This document maps the complete user journey for each role in the Care Haven platform, identifying:
- ✅ **Existing pages** - Already implemented
- 🟡 **Partially implemented** - Needs completion
- ❌ **Missing pages** - Need to be created
- ⚠️ **Needs enhancement** - Exists but needs UI/UX improvements

### User Roles
1. **Public Visitor** - Unauthenticated users viewing landing page
2. **Patient** - Healthcare consumers booking consultations
3. **Doctor** - Healthcare providers conducting consultations
4. **Admin** - Platform administrators with full access (2 people)
5. **Super Admin** - Platform administrators with limited access (2 people)

---

## Public Visitor Journey

### Entry Point
- **Landing Page** (`/`) ✅ **EXISTS**
  - Hero section with CTA
  - How It Works section
  - FAQs section
  - Footer with links

### Navigation Options
- **Sign In** (`/auth/signin`) ✅ **EXISTS**
  - Google OAuth button
  - Redirects to dashboard after authentication

- **Get Started** (`/auth/signin`) ✅ **EXISTS**
  - Same as Sign In page

- **Doctor Enrollment** (`/doctor/enroll`) ❌ **MISSING**
  - Should redirect to doctor sign-in or enrollment form
  - Currently no dedicated enrollment page

### Missing Pages
1. ❌ **Doctor Enrollment Page** - Dedicated page for doctor sign-up
2. ❌ **Privacy Policy Page** - Referenced in footer
3. ❌ **Terms of Service Page** - Referenced in footer
4. ❌ **Support Page** - Referenced in navigation

---

## Patient Journey

### Authentication Flow
1. **Sign In** (`/auth/signin`) ✅ **EXISTS**
   - Google OAuth
   - Creates patient profile

2. **Complete Profile** (`/complete-profile`) ✅ **EXISTS**
   - Required fields: name, DOB, gender, phone, blood group, allergies, conditions
   - Redirects to dashboard after completion

### Dashboard & Navigation
3. **Patient Dashboard** (`/patient`) ✅ **EXISTS**
   - Summary cards: Consultations, Appointments, Investigations
   - Patient demographics
   - Upcoming appointments list

4. **Sidebar Navigation** ✅ **EXISTS**
   - Dashboard
   - Sessions
   - Appointments
   - Investigations
   - Notifications
   - Profile
   - Settings & Preferences

### Appointment Management
5. **View Appointments** (`/patient/appointments`) ✅ **EXISTS**
   - Lists all appointments
   - Filter by status
   - View appointment details

6. **Book Appointment** (`/patient/appointments/book`) ⚠️ **NEEDS ENHANCEMENT**
   - **Current:** Form exists but missing:
     - ❌ Doctor selection UI (cards with photos)
     - ❌ Calendar date picker
     - ❌ Time selection dropdown
     - ❌ Order summary before checkout
   - **Needs:** Multi-step flow with progress indicators

7. **Reschedule Appointment** ❌ **MISSING**
   - Dialog component exists but not integrated
   - Need: Reschedule page or modal

8. **Cancel Appointment** ❌ **MISSING**
   - Need: Cancel confirmation dialog/page

### Consultation & Medical Records
9. **View Sessions** (`/patient/sessions`) ✅ **EXISTS**
   - Lists completed consultations
   - Click to view session notes

10. **View Session Notes** (`/patient/sessions/[id]`) ✅ **EXISTS**
    - Tabbed interface: Medical history, Requested Investigations, Diagnosis & Management
    - Read-only view for patients

11. **View Investigations** (`/patient/investigations`) ✅ **EXISTS**
    - Investigations History section
    - Pending Requests section
    - **Missing:** Upload functionality for pending requests

12. **Upload Investigation Results** ❌ **MISSING**
    - Need: Upload page/modal for pending investigations
    - File upload component needed

13. **View Prescriptions** ❌ **MISSING**
    - Need: Prescriptions page listing all prescriptions
    - Prescription details view

### Profile & Settings
14. **View Profile** (`/patient/profile`) ✅ **EXISTS**
    - Displays patient information

15. **Update Profile** (`/patient/profile`) 🟡 **NEEDS ENHANCEMENT**
    - **Current:** Basic form exists
    - **Missing:**
      - ❌ Profile photo upload
      - ❌ Camera icon overlay
      - ❌ Upload Profile Photo button

16. **Settings & Preferences** ❌ **MISSING**
    - Need: `/patient/settings` page
    - Sub-navigation: Notifications, Account
    - Notification preferences with toggles
    - Account management (sign out, delete account)

17. **View Notifications** ❌ **MISSING**
    - Need: Notifications page or dropdown
    - Notification bell component exists but not functional

### Communication
18. **Message Doctor** ❌ **MISSING**
    - Need: Messaging interface
    - Real-time messaging hook exists bu

### Video Consultation
19. **Join Video Consultation** 🟡 **NEEDS INTEGRATION**
    - Video interface component exists
    - Need: Integration with appointment flow
    - Need: Room creation and token generation

### Missing Pages Summary (Patient)
1. ❌ `/patient/appointments/reschedule` - Reschedule appointment page
2. ❌ `/patient/investigations/upload` - Upload investigation results
3. ❌ `/patient/prescriptions` - View prescriptions
4. ❌ `/patient/settings` - Settings & Preferences
5. ❌ `/patient/settings/notifications` - Notification preferences
6. ❌ `/patient/settings/account` - Account settings
7. ❌ `/patient/messages` - Messaging interface
8. ❌ `/patient/notifications` - Notifications page

---

## Doctor Journey

### Authentication Flow
1. **Sign In** (`/auth/signin`) ✅ **EXISTS**
   - Google OAuth
   - Creates doctor profile

2. **Complete Doctor Profile** (`/complete-profile`) ✅ **EXISTS**
   - License number, specialty, experience, fee, bio
   - **Needs Enhancement:** Enrollment form UI with three-column layout

### Dashboard & Navigation
3. **Doctor Dashboard** (`/doctor`) ✅ **EXISTS**
   - Summary cards: Consultations, Appointments, Investigations
   - Upcoming appointments list

4. **Sidebar Navigation** ✅ **EXISTS**
   - Dashboard
   - Sessions
   - Appointments
   - Investigations
   - Notifications
   - Profile
   - Settings & Preferences

### Appointment Management
5. **View Appointments** (`/doctor/appointments`) ✅ **EXISTS**
   - Lists all doctor's appointments
   - Filter by status

6. **View Appointment Details** 🟡 **NEEDS IMPLEMENTATION**
   - Need: `/doctor/appointments/[id]` page
   - Patient demographics
   - Medical history
   - Previous consultations
   - Join consultation button

7. **Join Video Consultation** 🟡 **NEEDS INTEGRATION**
   - Video interface component exists
   - Need: Integration with appointment flow

### Patient & Session Management
8. **View Clients** (`/doctor/sessions`) ✅ **EXISTS**
   - Lists all patients (clients)
   - Search functionality
   - Action buttons: View Session Details, Upload Session Notes

9. **View Client Details** (`/doctor/sessions/[id]`) ✅ **EXISTS**
   - Client information
   - Tabs: Sessions, Requested Investigations
   - List of consultations with this client

10. **View Session Notes** (`/doctor/sessions/[id]/notes`) ✅ **EXISTS**
    - Tabbed interface: Medical history, Requested Investigations, Diagnosis & Management
    - Editable form fields
    - Save Changes button

11. **Upload Session Notes** ❌ **MISSING**
    - Need: Upload functionality on client cards
    - File upload component needed

### Consultation Documentation
12. **Create SOAP Notes** ✅ **EXISTS**
    - Form component exists
    - **Needs:** Integration with prescription creation

13. **Create Prescription** ❌ **MISSING**
    - Need: Prescription form/page
    - Link medications to appointment
    - Prescription table exists but no UI

14. **Request Investigation** ❌ **MISSING**
    - Need: Investigation request form/page
    - Investigation table exists but no UI

15. **Review Investigation Results** ❌ **MISSING**
    - Need: Investigation review page
    - View uploaded results
    - Add interpretation

### Investigations
16. **View Investigations** (`/doctor/investigations`) ✅ **EXISTS**
    - Investigations History
    - Pending Requests

### Profile & Settings
17. **View Profile** (`/doctor/profile`) ✅ **EXISTS**
    - Displays doctor information

18. **Update Profile** (`/doctor/profile`) 🟡 **NEEDS ENHANCEMENT**
    - **Current:** Basic form exists
    - **Missing:**
      - ❌ Profile photo upload
      - ❌ Camera icon overlay
      - ❌ Upload Profile Photo button

19. **Settings & Preferences** ❌ **MISSING**
    - Need: `/doctor/settings` page
    - Sub-navigation: Notifications, Account
    - Notification preferences with toggles
    - Account management (sign out, delete account)

20. **View Notifications** ❌ **MISSING**
    - Need: Notifications page or dropdown
    - Notification bell component exists but not functional

### Communication
21. **Message Patients** ❌ **MISSING**
    - Need: Messaging interface
    - Real-time messaging hook exists but no UI

### Availability Management
22. **Set Availability** ❌ **MISSING**
    - Need: `/doctor/availability` page
    - Weekly schedule management
    - Block dates
    - Set break times

23. **View Schedule** ❌ **MISSING**
    - Need: Calendar view of appointments
    - React Big Calendar installed but not used

### Missing Pages Summary (Doctor)
1. ❌ `/doctor/appointments/[id]` - Appointment details page
2. ❌ `/doctor/prescriptions/create` - Create prescription page
3. ❌ `/doctor/investigations/request` - Request investigation page
4. ❌ `/doctor/investigations/[id]/review` - Review investigation results
5. ❌ `/doctor/sessions/upload` - Upload session notes
6. ❌ `/doctor/settings` - Settings & Preferences
7. ❌ `/doctor/settings/notifications` - Notification preferences
8. ❌ `/doctor/settings/account` - Account settings
9. ❌ `/doctor/availability` - Set availability
10. ❌ `/doctor/schedule` - View schedule calendar
11. ❌ `/doctor/messages` - Messaging interface
12. ❌ `/doctor/notifications` - Notifications page

---

## Admin Journey

### Authentication Flow
1. **Sign In** (`/auth/signin`) ✅ **EXISTS**
   - Google OAuth
   - Creates admin profile (role = 'admin')

2. **Admin Dashboard** ❌ **MISSING**
   - Need: `/admin` or `/admin/dashboard` page
   - Summary metrics
   - Quick access to key sections

### Navigation
3. **Admin Sidebar** ❌ **MISSING**
   - Dashboard
   - Users (Patients, Doctors)
   - Appointments
   - Analytics
   - Doctor Verification
   - System Health
   - Audit Logs
   - Settings

### User Management
4. **View All Patients** ❌ **MISSING**
   - Need: `/admin/patients` page
   - List all patients
   - Filter and search
   - Manage accounts

5. **View All Doctors** ❌ **MISSING**
   - Need: `/admin/doctors` page
   - List all doctors
   - Filter by verification status
   - Manage accounts

6. **Manage User Accounts** ❌ **MISSING**
   - Need: `/admin/users/[id]` page
   - View profile
   - Suspend/activate
   - Reset password
   - Delete account

### Doctor Verification
7. **Verify Doctor Licenses** ❌ **MISSING**
   - Need: `/admin/doctors/verify` page
   - Pending verifications list
   - View license documents
   - Approve/reject with reason

### Appointment Management
8. **View All Appointments** ❌ **MISSING**
   - Need: `/admin/appointments` page
   - List all appointments
   - Filter by status, date, doctor, patient
   - View details
   - Cancel appointments

### Analytics
9. **Platform Analytics** ❌ **MISSING**
   - Need: `/admin/analytics` page
   - User growth charts
   - Appointment statistics
   - Revenue metrics
   - Export functionality

### System Management
10. **System Health** 🟡 **PARTIALLY EXISTS**
    - Sentry integrated
    - Need: `/admin/system-health` page
    - Error logs
    - API response times
    - System uptime

11. **Audit Logs** ❌ **MISSING**
    - Need: `/admin/audit-logs` page
    - View all audit logs
    - Filter and search
    - Export for compliance

12. **System Configuration** ❌ **MISSING**
    - Need: `/admin/settings` page
    - Platform configuration
    - Notification templates
    - Feature flags

### Missing Pages Summary (Admin)
1. ❌ `/admin` or `/admin/dashboard` - Admin dashboard
2. ❌ `/admin/patients` - View all patients
3. ❌ `/admin/doctors` - View all doctors
4. ❌ `/admin/users/[id]` - Manage user account
5. ❌ `/admin/doctors/verify` - Verify doctor licenses
6. ❌ `/admin/appointments` - View all appointments
7. ❌ `/admin/analytics` - Platform analytics
8. ❌ `/admin/system-health` - System health monitoring
9. ❌ `/admin/audit-logs` - Audit logs
10. ❌ `/admin/settings` - System configuration

---

## Super Admin Journey

### Authentication Flow
1. **Sign In** (`/auth/signin`) ❌ **NEEDS ROLE UPDATE**
   - Google OAuth
   - Creates super admin profile (role = 'super_admin')
   - **Note:** Role needs to be added to schema

2. **Super Admin Dashboard** ❌ **MISSING**
   - Need: `/super-admin` or `/super-admin/dashboard` page
   - Read-only summary metrics
   - Limited access indicators

### Navigation
3. **Super Admin Sidebar** ❌ **MISSING**
   - Dashboard
   - Analytics (read-only)
   - System Health (read-only)
   - **No access to:** Users, Appointments, Doctor Verification, Audit Logs, Settings

### Analytics (Read-Only)
4. **View Platform Analytics** ❌ **MISSING**
   - Need: `/super-admin/analytics` page
   - Same metrics as admin but read-only
   - No export functionality
   - No configuration options

### System Health (Read-Only)
5. **View System Health** ❌ **MISSING**
   - Need: `/super-admin/system-health` page
   - Read-only system metrics
   - No detailed error logs
   - No configuration access

### Missing Pages Summary (Super Admin)
1. ❌ `/super-admin` or `/super-admin/dashboard` - Super Admin dashboard
2. ❌ `/super-admin/analytics` - Read-only analytics
3. ❌ `/super-admin/system-health` - Read-only system health

---

## Missing Pages & Features

### Critical Missing Pages (P0)

#### Patient
1. ❌ `/patient/appointments/book` - Enhanced booking flow (doctor selection, calendar, order summary)
2. ❌ `/patient/settings` - Settings & Preferences page
3. ❌ `/patient/investigations/upload` - Upload investigation results

#### Doctor
1. ❌ `/doctor/appointments/[id]` - Appointment details page
2. ❌ `/doctor/settings` - Settings & Preferences page
3. ❌ `/doctor/prescriptions/create` - Create prescription
4. ❌ `/doctor/investigations/request` - Request investigation

#### Admin
1. ❌ `/admin` - Admin dashboard
2. ❌ `/admin/doctors/verify` - Doctor license verification
3. ❌ `/admin/analytics` - Platform analytics

#### Super Admin
1. ❌ `/super-admin` - Super Admin dashboard
2. ❌ `/super-admin/analytics` - Read-only analytics

### High Priority Missing Pages (P1)

#### Patient
1. ❌ `/patient/prescriptions` - View prescriptions
2. ❌ `/patient/settings/notifications` - Notification preferences
3. ❌ `/patient/settings/account` - Account settings
4. ❌ `/patient/notifications` - Notifications page
5. ❌ `/patient/messages` - Messaging interface

#### Doctor
1. ❌ `/doctor/investigations/[id]/review` - Review investigation results
2. ❌ `/doctor/sessions/upload` - Upload session notes
3. ❌ `/doctor/settings/notifications` - Notification preferences
4. ❌ `/doctor/settings/account` - Account settings
5. ❌ `/doctor/notifications` - Notifications page
6. ❌ `/doctor/messages` - Messaging interface

#### Admin
1. ❌ `/admin/patients` - View all patients
2. ❌ `/admin/doctors` - View all doctors
3. ❌ `/admin/appointments` - View all appointments
4. ❌ `/admin/users/[id]` - Manage user account
5. ❌ `/admin/system-health` - System health monitoring

#### Super Admin
1. ❌ `/super-admin/system-health` - Read-only system health

### Medium Priority Missing Pages (P2)

#### Patient
1. ❌ `/patient/appointments/reschedule` - Reschedule appointment
2. ❌ `/patient/appointments/cancel` - Cancel appointment

#### Doctor
1. ❌ `/doctor/availability` - Set availability
2. ❌ `/doctor/schedule` - View schedule calendar

#### Admin
1. ❌ `/admin/audit-logs` - Audit logs

### Low Priority Missing Pages (P3)

#### Admin
1. ❌ `/admin/settings` - System configuration

### Public Pages
1. ❌ `/privacy-policy` - Privacy Policy page
2. ❌ `/terms-of-service` - Terms of Service page
3. ❌ `/support` - Support page
4. ❌ `/doctor/enroll` - Doctor enrollment page

---

## Implementation Priority

### Phase 1: Critical Patient & Doctor Features (Week 1-2)
**Goal:** Complete core booking and consultation flow

1. **Patient Booking Flow Enhancement**
   - Doctor selection UI with cards
   - Calendar date picker
   - Time selection
   - Order summary card

2. **Settings & Preferences (Patient & Doctor)**
   - Settings page with sub-navigation
   - Notification preferences with toggles
   - Account settings (sign out, delete)

3. **Upload Functionality**
   - Patient: Upload investigation results
   - Doctor: Upload session notes

4. **Appointment Details (Doctor)**
   - Appointment detail page
   - Patient information
   - Join consultation integration

### Phase 2: Admin & Super Admin (Week 3)
**Goal:** Enable platform administration

1. **Admin Dashboard**
   - Admin dashboard page
   - Navigation sidebar
   - Summary metrics

2. **Doctor Verification**
   - License verification page
   - Approve/reject workflow

3. **Super Admin Dashboard**
   - Super Admin dashboard
   - Read-only analytics
   - Access restrictions

### Phase 3: Additional Features (Week 4+)
**Goal:** Complete remaining features

1. **Prescription System**
   - Create prescription (doctor)
   - View prescriptions (patient)

2. **Investigation System**
   - Request investigation (doctor)
   - Review results (doctor)

3. **Messaging**
   - Messaging interface (patient & doctor)

4. **Notifications**
   - Notifications page/dropdown
   - Notification bell functionality

5. **Availability Management**
   - Set availability (doctor)
   - Schedule calendar view

---

## Component Requirements

### UI Components Needed
1. **Calendar Date Picker** - For appointment booking
2. **Doctor Selection Cards** - Horizontal cards with photos
3. **Order Summary Card** - Checkout confirmation
4. **Tabbed Interface** - For session notes
5. **Toggle Switches** - For notification preferences
6. **File Upload Component** - For investigations and session notes
7. **Progress Indicators** - For multi-step forms
8. **Settings Navigation** - Sub-navigation tabs
9. **Notification Bell** - Dropdown with unread count
10. **Confirmation Dialogs** - For destructive actions

### Data Components Needed
1. **Analytics Charts** - Line/bar charts for analytics
2. **Audit Log Viewer** - Table with filtering
3. **User Management Table** - With actions
4. **Appointment Calendar** - Calendar view for schedule

---

## Access Control Requirements

### Role-Based Access Control (RBAC)
- **Patient:** Access to `/patient/*` routes only
- **Doctor:** Access to `/doctor/*` routes only
- **Admin:** Access to `/admin/*` routes (full access)
- **Super Admin:** Access to `/super-admin/*` routes (limited/read-only)

### Middleware Updates Needed
- Add role checking in middleware
- Redirect based on role after authentication
- Protect admin routes from non-admin users
- Restrict super admin to read-only operations

---

**Document Status:** Complete  
**Next Steps:** Begin Phase 1 implementation  
**Owner:** Development Team  
**Review Date:** After Phase 1 completion
