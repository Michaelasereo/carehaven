# Care Haven - User Stories

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Product:** Telemedicine Platform  
**Status:** Comprehensive User Story Documentation

---

## Table of Contents
1. [Introduction](#introduction)
2. [User Story Format](#user-story-format)
3. [Public/Landing Page Stories](#publiclanding-page-stories)
4. [Patient User Stories](#patient-user-stories)
5. [Doctor User Stories](#doctor-user-stories)
6. [Admin User Stories](#admin-user-stories)
7. [Super Admin User Stories](#super-admin-user-stories)
8. [Epic Summary](#epic-summary)

---

## Introduction

This document contains comprehensive user stories for the Care Haven telemedicine platform. User stories are organized by user type and prioritized according to the MVP roadmap. Each story follows the standard format:

**As a** [user type]  
**I want** [goal/action]  
**So that** [benefit/value]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)  
**Status:** ✅ Complete | 🟡 In Progress | ❌ Not Started | ⚠️ Needs Work

---

## User Story Format

Each user story includes:
- **User Type:** Patient, Doctor, Admin, Super Admin, or Public Visitor
- **Epic:** High-level feature category
- **Priority:** Business priority level
- **Status:** Current implementation status
- **Acceptance Criteria:** Measurable success criteria
- **Dependencies:** Related stories or features
- **Technical Notes:** Implementation considerations

---

## Public/Landing Page Stories

### Epic 0: Landing Page & Public Access

#### US-LP-001: View Landing Page
**As a** visitor  
**I want** to view the Care Haven landing page  
**So that** I can learn about the platform and sign up

**Acceptance Criteria:**
- [ ] Header displays:
  - Care Haven logo (teal heart icon with text)
  - Navigation links: Home, How it Works, FAQs, Support
  - Login link
  - "Get Started >" button (teal/green)
- [ ] Hero section displays:
  - Headline: "Medical Consultations" (black) and "Made Simple & Secure" (teal)
  - Description paragraph about the platform
  - "Book a Consultation >" button (teal/green)
  - "Are you a healthcare provider? Join our platform→" link
- [ ] "How It Works" section displays:
  - Lock icon and "Secure and Confidential" text
  - Title "How It Works"
  - Three steps with checkmark icons:
    - Step 1: Create Your Account (with description)
    - Step 2: Book a Video Consultation (with description)
    - Step 3: Manage Your Health in One Place (with description)
  - Dashboard mockup image
- [ ] "Frequently asked questions" section displays:
  - Lock icon and "Secure and Confidential" text
  - Title "Frequently asked questions"
  - Introduction paragraph
  - FAQ accordion items (expandable/collapsible):
    - What is Care Haven?
    - Is my information secure?
    - How do I book an appointment?
    - Can I get a prescription through Care Haven?
- [ ] Footer displays:
  - Care Haven logo
  - Social media icons (Instagram, LinkedIn, X/Twitter, YouTube)
  - Copyright notice: "Carehaven © 2025 Carehaven LTD. All rights reserved. Built for Users."
  - Navigation links: How It Works, Privacy Policy, Terms of Service, Support, FAQs
  - Language selector: "English(US)" with dropdown
- [ ] Page is responsive on mobile devices
- [ ] All links and buttons are functional
- [ ] "Get Started" and "Book a Consultation" buttons redirect to sign-in
- [ ] "Join our platform" link redirects to doctor enrollment

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** None  
**Technical Notes:** Landing page exists at `app/page.tsx`

---

## Patient User Stories

### Epic 1: Authentication & Profile Management

#### US-P-001: Sign In with Google
**As a** patient  
**I want** to sign in using my Google account  
**So that** I can quickly access the platform without creating a new account

**Acceptance Criteria:**
- [ ] Google OAuth button is visible on sign-in page
- [ ] Clicking button redirects to Google OAuth consent screen
- [ ] After consent, user is redirected back to platform
- [ ] User profile is automatically created from Google account data
- [ ] Session is maintained across page refreshes

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** None  
**Technical Notes:** Uses Supabase Auth with Google OAuth provider

---

#### US-P-001A: Sign Up with Email and Password
**As a** new patient  
**I want** to create an account using my email and password  
**So that** I can access the platform without using a social media account

**Acceptance Criteria:**
- [ ] Sign-up page/form is accessible from the sign-in page
- [ ] Form includes email and password fields
- [ ] Password field has visibility toggle (show/hide)
- [ ] Email format is validated (must be valid email format)
- [ ] Password requirements are displayed and enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- [ ] Password confirmation field is present and matches password
- [ ] Form shows real-time validation errors
- [ ] Submit button is disabled until all validations pass
- [ ] After successful sign-up, user receives email verification link
- [ ] User profile is created with `profile_completed: false`
- [ ] User is redirected to email verification page or profile completion
- [ ] Error messages are displayed for duplicate emails or invalid credentials
- [ ] Success message confirms account creation

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** 
- Use Supabase Auth `signUp()` method
- Email confirmation required before full access
- Store user in `auth.users` and create corresponding `profiles` entry
- Password hashing handled by Supabase

---

#### US-P-001B: Sign In with Email and Password
**As a** patient  
**I want** to sign in using my email and password  
**So that** I can access my account securely

**Acceptance Criteria:**
- [ ] Sign-in page displays email and password input fields
- [ ] Email field accepts valid email format
- [ ] Password field has visibility toggle (show/hide)
- [ ] "Remember me" checkbox is available (optional)
- [ ] "Forgot Password?" link is visible and functional
- [ ] Form validates email format before submission
- [ ] Submit button is disabled if email is invalid
- [ ] Loading state is shown during authentication
- [ ] Error messages are displayed for:
  - Invalid email format
  - Incorrect password
  - Email not found
  - Unverified email (if email verification is required)
  - Account disabled/suspended
- [ ] Successfully authenticated users are redirected to their dashboard
- [ ] Session is maintained across page refreshes
- [ ] Users with incomplete profiles are redirected to profile completion
- [ ] Role-based redirection (patient → /patient, doctor → /doctor)

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-001A  
**Technical Notes:**
- Use Supabase Auth `signInWithPassword()` method
- Check `profile_completed` flag after authentication
- Implement session management with secure cookies
- Handle email verification status

---

#### US-P-001C: Reset Password
**As a** patient  
**I want** to reset my password when I forget it  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot Password?" link is visible on sign-in page
- [ ] Clicking link navigates to password reset page
- [ ] Password reset page has email input field
- [ ] Email format is validated before submission
- [ ] Submit button sends password reset email
- [ ] Success message confirms email has been sent
- [ ] Error message is shown if email is not found
- [ ] Password reset email contains secure reset link
- [ ] Reset link expires after 24 hours (configurable)
- [ ] Reset link can only be used once
- [ ] Clicking reset link navigates to password reset form
- [ ] Reset form requires:
  - New password input
  - Confirm password input
  - Password requirements displayed and enforced
- [ ] Password visibility toggles are available for both fields
- [ ] Form validates passwords match before submission
- [ ] Success message confirms password has been reset
- [ ] After successful reset, user is redirected to sign-in page
- [ ] User can sign in with new password immediately
- [ ] Old password is invalidated after reset
- [ ] Error messages are shown for:
  - Expired reset link
  - Invalid/used reset token
  - Password mismatch
  - Weak password (doesn't meet requirements)

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-001B  
**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()` method
- Reset token stored securely in Supabase
- Email template should include clear instructions
- Consider rate limiting for password reset requests
- Implement secure token validation

---

#### US-P-002: Complete Profile After First Sign In
**As a** new patient  
**I want** to complete my profile with medical information  
**So that** doctors have necessary context for consultations

**Acceptance Criteria:**
- [ ] New users are redirected to profile completion page
- [ ] Profile form includes: full name, date of birth, gender, phone number, blood group, allergies, chronic conditions
- [ ] All required fields are validated before submission
- [ ] Profile completion status is stored in database
- [ ] After completion, user is redirected to dashboard
- [ ] Incomplete profiles cannot access dashboard features

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** US-P-001  
**Technical Notes:** Middleware checks `profile_completed` flag

---

#### US-P-003: View My Profile
**As a** patient  
**I want** to view my profile information  
**So that** I can verify my details are correct

**Acceptance Criteria:**
- [ ] Profile page displays all stored information
- [ ] Patient demographics card shows name, age, gender, occupation, marital status
- [ ] Medical information (blood group, allergies, conditions) is visible
- [ ] Edit button allows profile updates

**Priority:** P1 (High)  
**Status:** ✅ Complete  
**Dependencies:** US-P-002

---

#### US-P-004: Update My Profile
**As a** patient  
**I want** to update my profile information  
**So that** my medical records remain accurate

**Acceptance Criteria:**
- [ ] Edit profile button opens editable form
- [ ] Large circular profile picture is displayed with camera icon overlay
- [ ] "Upload Profile Photo" button allows changing profile picture
- [ ] Form fields displayed in two columns:
  - First Name, Last Name, Email Address
  - Gender (dropdown), Marital Status (dropdown), Occupation (dropdown)
- [ ] All fields can be modified
- [ ] Changes are validated before saving
- [ ] Success message confirms update
- [ ] Updated information is reflected immediately
- [ ] "Save Changes" button at bottom right saves all updates

**Priority:** P1 (High)  
**Status:** 🟡 In Progress  
**Dependencies:** US-P-003
**Technical Notes:** Profile photo upload functionality needed

---

### Epic 2: Appointment Booking

#### US-P-005: Browse Available Doctors
**As a** patient  
**I want** to browse a list of available doctors  
**So that** I can choose the right healthcare provider

**Acceptance Criteria:**
- [ ] Doctor list page displays all verified doctors
- [ ] Doctor cards displayed horizontally with:
  - Professional photo
  - Doctor name (e.g., "Dr Peters", "Dr Adetola", "Dr Kemi")
  - Specialty (e.g., "Consultant, Gastroenterologist", "Consultant, Cardiologist", "Consultant, Nephrologist")
- [ ] Each doctor card shows: name, specialty, years of experience, consultation fee, bio
- [ ] Doctors can be filtered by specialty
- [ ] Doctors can be searched by name
- [ ] Only verified doctors (license_verified = true) are shown
- [ ] Cards are clickable/selectable for booking
- [ ] Selected doctor is highlighted
- [ ] Clicking a doctor card allows booking appointment

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-002  
**Technical Notes:** Requires doctor-list and doctor-card components with photo display

---

#### US-P-006: Book an Appointment
**As a** patient  
**I want** to book an appointment with a doctor  
**So that** I can schedule a consultation

**Acceptance Criteria:**
- [ ] Multi-step booking form guides user through process
- [ ] Progress indicator shows three steps:
  - "Step 1: Enter Details" (highlighted when active)
  - "Step 2: Match with Doctor" (highlighted when active)
  - "Step 3: Checkout" (highlighted when active)
- [ ] Step 1: Enter Details
  - Form fields: First Name, Last Name, Gender, Email Address, Age, Marital Status, Occupation
  - Fields: Reason for Consultation, Complaints (text area)
  - All fields are validated
  - "Next" button to proceed
- [ ] Step 2: Match with Doctor
  - Displays available doctors in horizontal cards
  - Each card shows: photo, name, specialty
  - Doctor selection is required
  - "Next" button to proceed
  - Back arrow to return to Step 1
- [ ] Step 3: Checkout
  - Selected doctor information displayed
  - Calendar date picker for selecting appointment date
  - Time selection dropdown (e.g., "9:00am")
  - Order summary card shows:
    - "Consultation with Dr [Name]"
    - Time: [selected time]
    - Venue: "Daily Co Video"
    - Subtotal: "NGN 20,000" (prominently displayed)
  - "Proceed to Checkout" button
  - Back arrow to return to Step 2
- [ ] Consultation fee is displayed and confirmed
- [ ] Validation prevents proceeding with incomplete information
- [ ] Appointment is created with status "scheduled" after submission

**Priority:** P0 (Critical)  
**Status:** ⚠️ Needs Work  
**Dependencies:** US-P-005  
**Technical Notes:** Currently missing doctor selection UI, calendar date picker, and order summary card

---

#### US-P-007: Pay for Appointment
**As a** patient  
**I want** to pay for my appointment securely  
**So that** my appointment is confirmed

**Acceptance Criteria:**
- [ ] After booking, user is redirected to payment page
- [ ] Payment amount matches doctor's consultation fee
- [ ] Paystack payment gateway is integrated
- [ ] Payment can be completed via card, bank transfer, or mobile money
- [ ] Payment reference is stored with appointment
- [ ] After successful payment, appointment status changes to "confirmed"
- [ ] Payment failure allows retry
- [ ] Payment receipt is generated

**Priority:** P0 (Critical)  
**Status:** 🟡 In Progress  
**Dependencies:** US-P-006  
**Technical Notes:** Payment callback route needed

---

#### US-P-008: View My Appointments
**As a** patient  
**I want** to view all my appointments  
**So that** I can track my consultation schedule

**Acceptance Criteria:**
- [ ] Appointments page lists all appointments
- [ ] Appointments are sorted by date (upcoming first)
- [ ] Each appointment card shows: doctor name, date/time, status, payment status
- [ ] Appointments can be filtered by status (upcoming, completed, cancelled)
- [ ] Upcoming appointments show "Join Consultation" button when active
- [ ] Completed appointments show "View Notes" link

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** US-P-006

---

#### US-P-009: Reschedule an Appointment
**As a** patient  
**I want** to reschedule my appointment  
**So that** I can accommodate schedule changes

**Acceptance Criteria:**
- [ ] Reschedule button is available for confirmed appointments (at least 24 hours before)
- [ ] Dialog allows selecting new date and time
- [ ] New time slot must be available for the doctor
- [ ] Reschedule request is sent to doctor for confirmation
- [ ] Patient receives notification when reschedule is approved/rejected
- [ ] Original appointment is updated with new time

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-008  
**Technical Notes:** Reschedule dialog component exists but not fully integrated

---

#### US-P-010: Cancel an Appointment
**As a** patient  
**I want** to cancel my appointment  
**So that** I can free up my schedule if needed

**Acceptance Criteria:**
- [ ] Cancel button is available for scheduled/confirmed appointments
- [ ] Cancellation confirmation dialog prevents accidental cancellation
- [ ] Reason for cancellation can be provided (optional)
- [ ] Appointment status changes to "cancelled"
- [ ] Doctor receives notification of cancellation
- [ ] Refund policy is applied (if applicable)

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-008

---

### Epic 3: Video Consultations

#### US-P-011: Join Video Consultation
**As a** patient  
**I want** to join my scheduled video consultation  
**So that** I can meet with my doctor

**Acceptance Criteria:**
- [ ] "Join Consultation" button appears 15 minutes before appointment time
- [ ] Clicking button creates Daily.co video room (if not exists)
- [ ] Secure access token is generated
- [ ] Video interface loads with patient video stream active
- [ ] Microphone and camera can be toggled
- [ ] Appointment status updates to "in_progress" when call starts
- [ ] Call quality is acceptable (low latency, clear audio/video)
- [ ] Connection errors show helpful error messages

**Priority:** P0 (Critical)  
**Status:** 🟡 In Progress  
**Dependencies:** US-P-007  
**Technical Notes:** Video interface component exists but not integrated with appointment flow

---

#### US-P-012: End Video Consultation
**As a** patient  
**I want** to leave the video consultation  
**So that** I can end the call when consultation is complete

**Acceptance Criteria:**
- [ ] Leave call button is clearly visible
- [ ] Confirmation dialog prevents accidental disconnection
- [ ] Appointment status updates to "completed" when call ends
- [ ] User is redirected to appointment details page
- [ ] SOAP notes and prescriptions become available after doctor completes them

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-011

---

### Epic 4: Medical Records

#### US-P-013: View Consultation Notes
**As a** patient  
**I want** to view my consultation notes  
**So that** I can review what was discussed during my appointment

**Acceptance Criteria:**
- [ ] Session notes page lists all completed consultations
- [ ] Each session card shows: date, doctor name, chief complaint
- [ ] Clicking session opens detailed SOAP notes view
- [ ] Consultation header displays:
  - "Consultation with Dr [Name]"
  - Date (e.g., "December 1st, 2025")
  - Consultation type tag (e.g., "Initial Consultation")
  - Time (e.g., "10:27am")
  - "Go back" link with arrow
- [ ] Patient demographics displayed: Name, Age, Sex, Occupation, Marital Status
- [ ] Three tabs for navigation:
  - "Medical history" (active state with underline)
  - "Requested Investigations"
  - "Diagnosis and Management"
- [ ] Medical history tab shows:
  - Presenting Complaint
  - History of Presenting Complaint
  - Past Medical & Surgical History
  - Family History
  - Drug and Social History
  - Any Vital Signs
- [ ] Requested Investigations tab shows list of investigations (e.g., "FBC")
- [ ] Diagnosis and Management tab shows:
  - Diagnosis (e.g., "Chronic back pain")
  - Management Plan
  - Drug Prescription
- [ ] SOAP notes display: Subjective, Objective, Assessment, Plan sections
- [ ] Notes are read-only (patients cannot edit)
- [ ] Historical notes are accessible from any previous appointment

**Priority:** P1 (High)  
**Status:** ✅ Complete  
**Dependencies:** US-P-012
**Technical Notes:** Tabbed interface with specific field layout needed

---

#### US-P-014: View My Prescriptions
**As a** patient  
**I want** to view my prescriptions  
**So that** I know what medications I've been prescribed

**Acceptance Criteria:**
- [ ] Prescriptions page lists all prescriptions
- [ ] Each prescription shows: date, doctor name, medications list
- [ ] Medication details include: name, dosage, frequency, duration
- [ ] Prescription status is displayed (active, filled, expired)
- [ ] Refills remaining is shown
- [ ] Instructions for taking medication are visible
- [ ] Prescriptions are linked to their respective appointments

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-013  
**Technical Notes:** Prescriptions table exists but UI not implemented

---

#### US-P-015: View Investigation Results
**As a** patient  
**I want** to view my lab investigation results  
**So that** I can see test outcomes

**Acceptance Criteria:**
- [ ] Investigations page shows all investigation requests
- [ ] Patient demographics displayed: Name, Age, Sex, Occupation, Marital Status
- [ ] "Investigations History" section with calendar icon:
  - Investigation cards arranged horizontally
  - Each card shows: investigation icon, test name (e.g., "Full Blood Count"), requesting doctor (e.g., "Dr Adeyemi")
- [ ] "Pending Requests" section:
  - Shows pending investigation cards
  - Each card has "Upload" button/icon for uploading results
- [ ] Investigations are categorized as "Pending" or "Completed"
- [ ] Completed investigations show: test name, results, doctor's interpretation
- [ ] Results can be downloaded as PDF (if available)
- [ ] Investigation results are linked to appointment
- [ ] Date completed is displayed

**Priority:** P1 (High)  
**Status:** ✅ Complete (View only)  
**Dependencies:** None  
**Technical Notes:** Investigation viewing exists, upload functionality needed

---

#### US-P-015A: Upload Investigation Results
**As a** patient  
**I want** to upload investigation results for pending requests  
**So that** my doctor can review the test results

**Acceptance Criteria:**
- [ ] "Upload" button/icon is visible on pending investigation cards
- [ ] Clicking upload opens file upload dialog
- [ ] Can upload PDF, images, or documents
- [ ] Upload progress is shown during upload
- [ ] Success confirmation message after upload
- [ ] Investigation status changes from "pending" to "completed" after upload
- [ ] Doctor receives notification when results are uploaded
- [ ] Uploaded file is stored securely and linked to investigation

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-015  
**Technical Notes:** File upload component and storage integration needed

---

### Epic 5: Communication & Notifications

#### US-P-016: Receive Appointment Notifications
**As a** patient  
**I want** to receive notifications about my appointments  
**So that** I don't miss important updates

**Acceptance Criteria:**
- [ ] Email notification sent when appointment is confirmed
- [ ] SMS notification sent 24 hours before appointment
- [ ] Email/SMS reminder sent 1 hour before appointment
- [ ] Notification sent when appointment is rescheduled
- [ ] Notification sent when appointment is cancelled
- [ ] In-app notification bell shows unread count
- [ ] Notifications can be marked as read

**Priority:** P1 (High)  
**Status:** 🟡 In Progress  
**Dependencies:** US-P-007  
**Technical Notes:** Notification system exists but not fully connected to events

---

#### US-P-017: Message My Doctor
**As a** patient  
**I want** to send messages to my doctor  
**So that** I can ask follow-up questions

**Acceptance Criteria:**
- [ ] Messaging interface is accessible from appointment details
- [ ] Messages are sent in real-time using Supabase Realtime
- [ ] Message history is displayed chronologically
- [ ] Read receipts show when doctor has read message
- [ ] Messages can include text content
- [ ] File attachments can be sent (images, documents)
- [ ] Messages are linked to appointment (optional)

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** Real-time messaging hook exists but no UI

---

#### US-P-018: View Notifications
**As a** patient  
**I want** to view all my notifications  
**So that** I stay informed about platform activities

**Acceptance Criteria:**
- [ ] Notification bell icon shows unread count badge
- [ ] Clicking bell opens notifications dropdown
- [ ] Notifications page shows full list of notifications
- [ ] Notifications are categorized by type (appointment, prescription, investigation, message)
- [ ] Notifications can be marked as read
- [ ] Clicking notification navigates to relevant page
- [ ] Old notifications can be cleared

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-016  
**Technical Notes:** Notification bell component exists but not functional

---

### Epic 6: Settings & Preferences

#### US-P-020: Access Settings & Preferences
**As a** patient  
**I want** to access settings and preferences  
**So that** I can manage my account and notification preferences

**Acceptance Criteria:**
- [ ] Settings & Preferences page is accessible from navigation
- [ ] Sub-navigation tabs are displayed:
  - "Notifications" tab
  - "Account" tab
- [ ] Active tab is highlighted (green/teal color)
- [ ] Can switch between tabs
- [ ] Each tab shows relevant settings options

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** Settings page and sub-navigation component needed

---

#### US-P-021: Manage Notification Preferences
**As a** patient  
**I want** to manage my notification preferences  
**So that** I control how I receive updates

**Acceptance Criteria:**
- [ ] Notifications tab displays:
  - "Allow SMS Notifications" option with:
    - Bell icon
    - Toggle switch (can be On/Off)
    - Description: "Toggle On to allow SMS notifications"
  - "Allow Email Notifications" option with:
    - Envelope icon
    - Toggle switch (can be On/Off)
    - Description: "Toggle On to allow Email notifications"
- [ ] Toggle switches are functional
- [ ] Current state is reflected (On = green, Off = gray)
- [ ] Changes are saved automatically or with save button
- [ ] Preferences are stored in user profile

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-020  
**Technical Notes:** Toggle switch component and preference storage needed

---

#### US-P-022: Manage Account Settings
**As a** patient  
**I want** to manage my account settings  
**So that** I can control my account lifecycle

**Acceptance Criteria:**
- [ ] Account tab displays:
  - "Account" heading
  - Description paragraph about the platform
  - "Sign Out of Account" option with:
    - Red square icon (arrow pointing out)
    - Text "Sign Out of Account"
    - Description text
  - "Danger Zone" section with:
    - "Danger Zone" heading
    - "Delete Account" option with:
      - Red square icon (trash can)
      - Text "Delete Account"
      - Description text
- [ ] Sign out functionality works and ends session
- [ ] Delete account requires confirmation dialog
- [ ] Account actions are clearly separated and visually distinct
- [ ] Warning messages for destructive actions

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-020  
**Technical Notes:** Account management actions and confirmation dialogs needed

---

### Epic 7: Dashboard & Overview

#### US-P-019: View Dashboard Overview
**As a** patient  
**I want** to see an overview of my healthcare activities  
**So that** I can quickly understand my health status

**Acceptance Criteria:**
- [ ] Dashboard displays three summary cards horizontally:
  - Total Consultations card with stethoscope icon and count (e.g., "06")
  - Upcoming Appointments card with calendar icon and count (e.g., "32")
  - Investigations card with document icon and count (e.g., "02")
- [ ] Patient demographics card shows: Name, Age, Sex, Occupation, Marital Status
- [ ] "Upcoming Appointments" section displays appointment cards:
  - Each card shows: "Consultation with Dr [Name]", time range (e.g., "10AM - 11AM"), description
  - Circular action button with arrow icon on each card
- [ ] Quick actions are available: Book Appointment, View Appointments
- [ ] Dashboard is responsive on mobile devices
- [ ] Data refreshes automatically or shows loading state

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** US-P-002, US-P-008
**Technical Notes:** Summary cards with icons and counts are displayed

---

## Doctor User Stories

### Epic 7: Doctor Authentication & Profile

#### US-D-001: Sign In with Google
**As a** doctor  
**I want** to sign in using my Google account  
**So that** I can access my practice dashboard

**Acceptance Criteria:**
- [ ] Google OAuth button works for doctors
- [ ] Doctor profile is created with role = 'doctor'
- [ ] License verification workflow is initiated

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** None

---

#### US-D-001A: Sign Up with Email and Password (Doctor)
**As a** new doctor  
**I want** to create an account using my email and password  
**So that** I can access the platform without using a social media account

**Acceptance Criteria:**
- [ ] Sign-up page/form is accessible from the sign-in page or doctor enrollment page
- [ ] Form includes email and password fields
- [ ] Password field has visibility toggle (show/hide)
- [ ] Email format is validated (must be valid email format)
- [ ] Password requirements are displayed and enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- [ ] Password confirmation field is present and matches password
- [ ] Form shows real-time validation errors
- [ ] Submit button is disabled until all validations pass
- [ ] After successful sign-up, user receives email verification link
- [ ] Doctor profile is created with `role: 'doctor'` and `profile_completed: false`
- [ ] User is redirected to email verification page or doctor enrollment form
- [ ] Error messages are displayed for duplicate emails or invalid credentials
- [ ] Success message confirms account creation
- [ ] License verification workflow is initiated after profile completion

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** 
- Use Supabase Auth `signUp()` method
- Email confirmation required before full access
- Store user in `auth.users` and create corresponding `profiles` entry with `role: 'doctor'`
- Password hashing handled by Supabase
- Redirect to doctor enrollment form after verification

---

#### US-D-001B: Sign In with Email and Password (Doctor)
**As a** doctor  
**I want** to sign in using my email and password  
**So that** I can access my account securely

**Acceptance Criteria:**
- [ ] Sign-in page displays email and password input fields
- [ ] Email field accepts valid email format
- [ ] Password field has visibility toggle (show/hide)
- [ ] "Remember me" checkbox is available (optional)
- [ ] "Forgot Password?" link is visible and functional
- [ ] Form validates email format before submission
- [ ] Submit button is disabled if email is invalid
- [ ] Loading state is shown during authentication
- [ ] Error messages are displayed for:
  - Invalid email format
  - Incorrect password
  - Email not found
  - Unverified email (if email verification is required)
  - Account disabled/suspended
  - Unverified license (if license verification is required)
- [ ] Successfully authenticated doctors are redirected to doctor dashboard (`/doctor`)
- [ ] Session is maintained across page refreshes
- [ ] Doctors with incomplete profiles are redirected to profile completion/enrollment
- [ ] License verification status is checked after authentication

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-001A  
**Technical Notes:**
- Use Supabase Auth `signInWithPassword()` method
- Check `profile_completed` flag after authentication
- Check `license_verified` status for doctors
- Implement session management with secure cookies
- Handle email verification status
- Redirect based on license verification status

---

#### US-D-001C: Reset Password (Doctor)
**As a** doctor  
**I want** to reset my password when I forget it  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot Password?" link is visible on sign-in page
- [ ] Clicking link navigates to password reset page
- [ ] Password reset page has email input field
- [ ] Email format is validated before submission
- [ ] Submit button sends password reset email
- [ ] Success message confirms email has been sent
- [ ] Error message is shown if email is not found
- [ ] Password reset email contains secure reset link
- [ ] Reset link expires after 24 hours (configurable)
- [ ] Reset link can only be used once
- [ ] Clicking reset link navigates to password reset form
- [ ] Reset form requires:
  - New password input
  - Confirm password input
  - Password requirements displayed and enforced
- [ ] Password visibility toggles are available for both fields
- [ ] Form validates passwords match before submission
- [ ] Success message confirms password has been reset
- [ ] After successful reset, user is redirected to sign-in page
- [ ] Doctor can sign in with new password immediately
- [ ] Old password is invalidated after reset
- [ ] Error messages are shown for:
  - Expired reset link
  - Invalid/used reset token
  - Password mismatch
  - Weak password (doesn't meet requirements)

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-001B  
**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()` method
- Reset token stored securely in Supabase
- Email template should include clear instructions
- Consider rate limiting for password reset requests
- Implement secure token validation
- Works for both patients and doctors (shared functionality)

---

#### US-D-002: Complete Doctor Profile
**As a** doctor  
**I want** to complete my professional profile  
**So that** patients can find and book appointments with me

**Acceptance Criteria:**
- [ ] Doctor enrollment form displays:
  - Title "Doctor's Enrollment"
  - Subtitle "Made Simple & Secure"
  - Description paragraph about joining the platform
  - Form fields in three-column layout:
    - Row 1: First Name, Last Name, Gender (dropdown)
    - Row 2: Email Address, Age, License Type (dropdown, e.g., "MBBS")
    - Row 3: Specialty (dropdown, e.g., "Cardiology")
  - Professional Summary text area (multi-line)
  - Agreement checkbox: "I hereby agree to the Terms of Service and Privacy Policy of CareHaven"
    - Terms of Service and Privacy Policy are clickable links (teal/green)
  - "Complete" button (teal/green) at bottom right
- [ ] Doctor profile form includes: license number, specialty, years of experience, consultation fee, bio
- [ ] License number is validated
- [ ] Specialty can be selected from predefined list
- [ ] Consultation fee can be set in Nigerian Naira
- [ ] Profile photo can be uploaded
- [ ] Profile is marked as complete after submission
- [ ] License verification status is shown (pending, verified, rejected)
- [ ] All fields are required and validated before submission

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** US-D-001
**Technical Notes:** Enrollment form UI with three-column layout and agreement checkbox needed

---

#### US-D-003: Update Doctor Profile
**As a** doctor  
**I want** to update my profile information  
**So that** my information stays current

**Acceptance Criteria:**
- [ ] Profile page displays large circular profile picture
- [ ] Camera icon overlay on profile picture indicates ability to change photo
- [ ] "Upload Profile Photo" button next to profile picture
- [ ] Form fields displayed in grid layout:
  - First Name, Last Name, Gender, Email Address
  - Marital Status, License Type, Specialty (dropdowns)
- [ ] Professional Summary text area
- [ ] All profile fields can be edited
- [ ] Consultation fee changes require confirmation
- [ ] "Save Changes" button at bottom right
- [ ] Updates are saved and reflected immediately
- [ ] Patients see updated information

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-002
**Technical Notes:** Profile photo upload functionality needed

---

### Epic 8: Appointment Management

#### US-D-004: View My Appointments
**As a** doctor  
**I want** to view all my appointments  
**So that** I can manage my schedule

**Acceptance Criteria:**
- [ ] Doctor dashboard shows all appointments
- [ ] Appointments are sorted by date/time
- [ ] Each appointment shows: patient name, date/time, status, chief complaint
- [ ] Appointments can be filtered by status (scheduled, confirmed, in_progress, completed, cancelled)
- [ ] Upcoming appointments for today are highlighted
- [ ] Appointment count metrics are displayed

**Priority:** P0 (Critical)  
**Status:** ✅ Complete  
**Dependencies:** US-D-002

---

#### US-D-005: View Appointment Details
**As a** doctor  
**I want** to view detailed information about an appointment  
**So that** I can prepare for the consultation

**Acceptance Criteria:**
- [ ] Appointment detail page shows: patient demographics, chief complaint, symptoms, appointment history
- [ ] Patient's medical history (allergies, chronic conditions) is visible
- [ ] Previous consultation notes with this patient are accessible
- [ ] "Join Consultation" button appears at appointment time
- [ ] "Add Notes" button is available after consultation

**Priority:** P0 (Critical)  
**Status:** 🟡 In Progress  
**Dependencies:** US-D-004  
**Technical Notes:** Appointment detail page needs to be created

---

#### US-D-006: Join Video Consultation
**As a** doctor  
**I want** to join the video consultation  
**So that** I can conduct the appointment

**Acceptance Criteria:**
- [ ] "Join Consultation" button is available at appointment time
- [ ] Daily.co video room is created automatically
- [ ] Secure token is generated
- [ ] Video interface loads successfully
- [ ] Camera and microphone can be toggled
- [ ] Screen sharing is available (future)
- [ ] Appointment status updates to "in_progress"

**Priority:** P0 (Critical)  
**Status:** 🟡 In Progress  
**Dependencies:** US-D-005  
**Technical Notes:** Same video interface as patients, with doctor privileges

---

#### US-D-007: Update Appointment Status
**As a** doctor  
**I want** to update appointment status  
**So that** I can track consultation progress

**Acceptance Criteria:**
- [ ] Status can be updated: confirmed, in_progress, completed, cancelled, no_show
- [ ] Status updates trigger notifications to patient
- [ ] Completed status allows creating SOAP notes
- [ ] Status history is logged

**Priority:** P0 (Critical)  
**Status:** 🟡 In Progress  
**Dependencies:** US-D-004

---

### Epic 9: Consultation Documentation

#### US-D-008: Create SOAP Notes
**As a** doctor  
**I want** to create SOAP notes for consultations  
**So that** I can document patient encounters

**Acceptance Criteria:**
- [ ] Session notes page shows consultation header:
  - "Consultation with Dr [Name]"
  - Date (e.g., "December 1st, 2025")
  - Consultation type tag (e.g., "Initial Consultation")
  - Time (e.g., "10:27am")
  - "Go back" link with arrow
- [ ] Patient demographics displayed: Name, Age, Sex, Occupation, Marital Status
- [ ] Three tabs for navigation:
  - "Medical history" (active state with underline)
  - "Requested Investigations"
  - "Diagnosis and Management" (active state with teal outline)
- [ ] Medical history tab shows editable form fields:
  - Presenting Complaint
  - History of Presenting Complaint
  - Past Medical & Surgical History
  - Family History
  - Drug and Social History
  - Any Vital Signs
- [ ] Requested Investigations tab shows investigations list
- [ ] Diagnosis and Management tab shows editable fields:
  - Diagnosis (e.g., "Chronic back pain")
  - Management Plan
  - Drug Prescription
- [ ] SOAP form is accessible from completed appointments
- [ ] Form includes: Subjective, Objective, Assessment, Plan sections
- [ ] Diagnosis field allows entering primary and secondary diagnoses
- [ ] Management plan can be entered as text
- [ ] Notes can be saved as draft and edited later
- [ ] "Save Changes" button at bottom right
- [ ] Saved notes are linked to appointment
- [ ] Patient can view notes after they are saved
- [ ] Notes are stored securely with proper access controls

**Priority:** P1 (High)  
**Status:** ✅ Complete (Form exists, needs prescription integration)  
**Dependencies:** US-D-006  
**Technical Notes:** SOAP form component exists but prescription creation not connected. Tabbed interface with specific field layout needed.

---

#### US-D-009: Create Prescription
**As a** doctor  
**I want** to create prescriptions for patients  
**So that** I can prescribe medications

**Acceptance Criteria:**
- [ ] Prescription form allows adding multiple medications
- [ ] For each medication: name, dosage, frequency, duration, instructions
- [ ] Refills can be specified
- [ ] Prescription is linked to appointment and consultation notes
- [ ] Prescription status is set to "active"
- [ ] Expiration date is calculated based on duration
- [ ] Patient receives notification when prescription is created
- [ ] Prescription can be printed or shared as PDF

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-008  
**Technical Notes:** Prescription table exists, need to create UI and connect to SOAP form

---

#### US-D-010: Request Lab Investigation
**As a** doctor  
**I want** to request lab investigations  
**So that** I can order diagnostic tests

**Acceptance Criteria:**
- [ ] Investigation request form is accessible from appointment
- [ ] Form allows specifying: test name, test type, special instructions
- [ ] Multiple investigations can be requested in one form
- [ ] Investigation is linked to appointment and patient
- [ ] Status is set to "requested"
- [ ] Patient receives notification with investigation details
- [ ] Investigation results can be uploaded later
- [ ] Doctor can add interpretation to results

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-008  
**Technical Notes:** Investigation table exists, need UI for creating requests

---

#### US-D-011: Review Investigation Results
**As a** doctor  
**I want** to review uploaded investigation results  
**So that** I can interpret and provide feedback

**Acceptance Criteria:**
- [ ] Investigation results page shows pending reviews
- [ ] Results can be viewed (PDF, images, text)
- [ ] Doctor can add interpretation/notes
- [ ] Investigation status can be updated to "completed"
- [ ] Patient receives notification when results are reviewed
- [ ] Results are linked to patient's medical record

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-010

---

### Epic 10: Patient Management

#### US-D-012: View My Patients
**As a** doctor  
**I want** to view all patients who have appointments with me  
**So that** I can manage patient relationships

**Acceptance Criteria:**
- [ ] "Clients and Session Notes" page displays:
  - Title "Clients and Session Notes"
  - Search bar with magnifying glass icon and "Search" placeholder
  - List of client cards showing:
    - Client name, age, gender (e.g., "Odeyemi Makinde 69yrs M")
    - Action button: "View Session Details" or "Upload Session Notes"
- [ ] Patients page lists all unique patients
- [ ] Each patient card shows: name, age, last appointment date
- [ ] Patients can be searched by name
- [ ] Clicking patient card shows patient profile

**Priority:** P1 (High)  
**Status:** ✅ Complete  
**Dependencies:** US-D-004
**Technical Notes:** Client card component with action buttons exists

---

#### US-D-013: View Patient Medical History
**As a** doctor  
**I want** to view a patient's complete medical history  
**So that** I can provide informed care

**Acceptance Criteria:**
- [ ] Client details page shows:
  - Client information: Name, Age, Gender (e.g., "Odeyemi Makinde 69yrs M")
  - Two tabs: "Sessions" (active) and "Requested Investigations"
  - Filter icon below tabs
  - List of sessions:
    - "Consultation with Dr [Name]"
    - Date (e.g., "December 23rd")
    - Time (e.g., "10:00am")
    - "View Session Notes" button on each session
- [ ] Patient profile shows: demographics, allergies, chronic conditions
- [ ] Complete appointment history is displayed
- [ ] All SOAP notes for this patient are accessible
- [ ] Prescription history is shown
- [ ] Investigation history is displayed
- [ ] Medical timeline shows chronological events

**Priority:** P1 (High)  
**Status:** 🟡 In Progress  
**Dependencies:** US-D-012  
**Technical Notes:** Client card component exists, needs expansion. Tabbed interface for sessions and investigations needed.

---

### Epic 11: Availability Management

#### US-D-014: Set My Availability
**As a** doctor  
**I want** to set my available time slots  
**So that** patients can book appointments when I'm available

**Acceptance Criteria:**
- [ ] Availability management page allows setting weekly schedule
- [ ] Time slots can be set per day of week
- [ ] Specific dates can be blocked (holidays, vacations)
- [ ] Break times can be set
- [ ] Availability is saved and applied to booking system
- [ ] Patients only see available slots when booking

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-006  
**Technical Notes:** Doctor availability table exists in schema but no UI

---

#### US-D-015: View My Schedule
**As a** doctor  
**I want** to view my weekly/monthly schedule  
**So that** I can plan my time

**Acceptance Criteria:**
- [ ] Calendar view shows all appointments
- [ ] Schedule can be viewed by day, week, or month
- [ ] Available slots are highlighted differently from booked slots
- [ ] Appointments can be clicked to view details
- [ ] Schedule is color-coded by appointment status

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-014

---

### Epic 12: Doctor Dashboard & Analytics

#### US-D-016: View Dashboard Metrics
**As a** doctor  
**I want** to see key metrics about my practice  
**So that** I can track my performance

**Acceptance Criteria:**
- [ ] Dashboard displays three summary cards horizontally:
  - Total Consultations card with stethoscope icon and count (e.g., "06")
  - Upcoming Appointments card with calendar icon and count (e.g., "32")
  - Investigations card with document icon and count (e.g., "02")
- [ ] "Upcoming Appointments" section shows appointment cards:
  - Each card shows: "Consultation with Dr [Name]", time range (e.g., "10AM - 11AM"), description
  - Circular action button with arrow icon on each card
- [ ] Dashboard shows: total consultations, upcoming appointments, investigations count
- [ ] Metrics are calculated in real-time
- [ ] Visual charts/graphs show trends (future)
- [ ] Revenue summary is displayed (future)

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (Basic metrics)  
**Dependencies:** US-D-002
**Technical Notes:** Summary cards with icons and counts are displayed

---

#### US-D-017: Receive Notifications
**As a** doctor  
**I want** to receive notifications about appointments and messages  
**So that** I stay informed

**Acceptance Criteria:**
- [ ] Email notification when new appointment is booked
- [ ] SMS notification for urgent appointments (optional)
- [ ] In-app notification when patient sends message
- [ ] Notification when appointment is rescheduled or cancelled
- [ ] Notification bell shows unread count
- [ ] Notifications can be marked as read

**Priority:** P1 (High)  
**Status:** 🟡 In Progress  
**Dependencies:** None  
**Technical Notes:** Notification system exists but not fully connected

---

#### US-D-018: Message Patients
**As a** doctor  
**I want** to send messages to my patients  
**So that** I can provide follow-up care

**Acceptance Criteria:**
- [ ] Messaging interface accessible from patient profile
- [ ] Messages are sent in real-time
- [ ] Message history is maintained
- [ ] Read receipts show when patient has read
- [ ] Messages can include attachments
- [ ] Messages can be linked to appointments

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-P-017

---

#### US-D-019: Upload Session Notes
**As a** doctor  
**I want** to upload session notes for a consultation  
**So that** I can add documentation after the consultation

**Acceptance Criteria:**
- [ ] "Upload Session Notes" button is available on client cards
- [ ] Clicking button opens file upload interface
- [ ] Can upload document files (PDF, Word, images)
- [ ] Upload is linked to specific consultation/appointment
- [ ] Upload progress is shown during upload
- [ ] Success confirmation after upload
- [ ] Uploaded notes are accessible in patient's session history

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-012  
**Technical Notes:** File upload component and storage integration needed

---

#### US-D-020: Access Settings & Preferences
**As a** doctor  
**I want** to access settings and preferences  
**So that** I can manage my account and notification preferences

**Acceptance Criteria:**
- [ ] Settings & Preferences page is accessible from navigation
- [ ] Sub-navigation tabs are displayed:
  - "Notifications" tab
  - "Account" tab
- [ ] Active tab is highlighted (green/teal color)
- [ ] Can switch between tabs
- [ ] Each tab shows relevant settings options

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** Settings page and sub-navigation component needed

---

#### US-D-021: Manage Doctor Notification Preferences
**As a** doctor  
**I want** to manage my notification preferences  
**So that** I control how I receive updates

**Acceptance Criteria:**
- [ ] Notifications tab displays:
  - "Allow SMS Notifications" option with:
    - Bell icon
    - Toggle switch (can be On/Off)
    - Description: "Toggle On to allow SMS notifications"
  - "Allow Email Notifications" option with:
    - Envelope icon
    - Toggle switch (can be On/Off)
    - Description: "Toggle On to allow Email notifications"
- [ ] Toggle switches are functional
- [ ] Current state is reflected (On = green, Off = gray)
- [ ] Changes are saved automatically or with save button
- [ ] Preferences are stored in doctor profile

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-020  
**Technical Notes:** Toggle switch component and preference storage needed

---

#### US-D-022: Manage Doctor Account Settings
**As a** doctor  
**I want** to manage my account settings  
**So that** I can control my account lifecycle

**Acceptance Criteria:**
- [ ] Account tab displays:
  - "Account" heading
  - Description paragraph about the platform
  - "Sign Out of Account" option with:
    - Red square icon (arrow pointing out)
    - Text "Sign Out of Account"
    - Description text
  - "Danger Zone" section with:
    - "Danger Zone" heading
    - "Delete Account" option with:
      - Red square icon (trash can)
      - Text "Delete Account"
      - Description text
- [ ] Sign out functionality works and ends session
- [ ] Delete account requires confirmation dialog
- [ ] Account actions are clearly separated and visually distinct
- [ ] Warning messages for destructive actions

**Priority:** P1 (High)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-020  
**Technical Notes:** Account management actions and confirmation dialogs needed

---

## Admin User Stories

**Note:** Admin role has full access to all platform features. Super Admin role has limited access (read-only analytics, no user management, no system configuration).

### Epic 13: Admin Authentication & Access

#### US-A-001: Sign In as Admin
**As an** admin  
**I want** to sign in to the admin dashboard  
**So that** I can access administrative features

**Acceptance Criteria:**
- [ ] Admin can sign in using Google OAuth (same as other users)
- [ ] Admin profile is created with role = 'admin'
- [ ] Admin is redirected to admin dashboard after sign-in
- [ ] Admin dashboard is only accessible to users with admin role
- [ ] Session is maintained across page refreshes

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** Admin role exists in schema, admin dashboard UI needed

---

#### US-A-001A: Sign Up with Email and Password (Admin)
**As a** new admin  
**I want** to create an account using my email and password  
**So that** I can access the admin dashboard without using a social media account

**Acceptance Criteria:**
- [ ] Sign-up page/form is accessible from the sign-in page
- [ ] Form includes email and password fields
- [ ] Password field has visibility toggle (show/hide)
- [ ] Email format is validated (must be valid email format)
- [ ] Password requirements are displayed and enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- [ ] Password confirmation field is present and matches password
- [ ] Form shows real-time validation errors
- [ ] Submit button is disabled until all validations pass
- [ ] Admin account creation requires approval or special invitation code
- [ ] After successful sign-up, user receives email verification link
- [ ] Admin profile is created with `role: 'admin'` and `profile_completed: false`
- [ ] User is redirected to email verification page or admin dashboard
- [ ] Error messages are displayed for duplicate emails or invalid credentials
- [ ] Success message confirms account creation
- [ ] Admin dashboard is only accessible after email verification

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** 
- Use Supabase Auth `signUp()` method
- Email confirmation required before full access
- Store user in `auth.users` and create corresponding `profiles` entry with `role: 'admin'`
- Password hashing handled by Supabase
- Consider adding invitation code system for admin account creation
- Admin accounts should be manually approved or created by existing admins

---

#### US-A-001B: Sign In with Email and Password (Admin)
**As an** admin  
**I want** to sign in using my email and password  
**So that** I can access my admin account securely

**Acceptance Criteria:**
- [ ] Sign-in page displays email and password input fields
- [ ] Email field accepts valid email format
- [ ] Password field has visibility toggle (show/hide)
- [ ] "Remember me" checkbox is available (optional)
- [ ] "Forgot Password?" link is visible and functional
- [ ] Form validates email format before submission
- [ ] Submit button is disabled if email is invalid
- [ ] Loading state is shown during authentication
- [ ] Error messages are displayed for:
  - Invalid email format
  - Incorrect password
  - Email not found
  - Unverified email (if email verification is required)
  - Account disabled/suspended
  - Insufficient permissions (non-admin trying to access admin area)
- [ ] Successfully authenticated admins are redirected to admin dashboard (`/admin`)
- [ ] Session is maintained across page refreshes
- [ ] Admins with incomplete profiles are redirected to profile completion
- [ ] Admin role is verified after authentication
- [ ] Non-admin users are blocked from accessing admin routes

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-001A  
**Technical Notes:**
- Use Supabase Auth `signInWithPassword()` method
- Check `profile_completed` flag after authentication
- Verify `role: 'admin'` in profile before granting access
- Implement session management with secure cookies
- Handle email verification status
- Middleware should check admin role for protected routes

---

#### US-A-001C: Reset Password (Admin)
**As an** admin  
**I want** to reset my password when I forget it  
**So that** I can regain access to my admin account

**Acceptance Criteria:**
- [ ] "Forgot Password?" link is visible on sign-in page
- [ ] Clicking link navigates to password reset page
- [ ] Password reset page has email input field
- [ ] Email format is validated before submission
- [ ] Submit button sends password reset email
- [ ] Success message confirms email has been sent
- [ ] Error message is shown if email is not found
- [ ] Password reset email contains secure reset link
- [ ] Reset link expires after 24 hours (configurable)
- [ ] Reset link can only be used once
- [ ] Clicking reset link navigates to password reset form
- [ ] Reset form requires:
  - New password input
  - Confirm password input
  - Password requirements displayed and enforced
- [ ] Password visibility toggles are available for both fields
- [ ] Form validates passwords match before submission
- [ ] Success message confirms password has been reset
- [ ] After successful reset, user is redirected to sign-in page
- [ ] Admin can sign in with new password immediately
- [ ] Old password is invalidated after reset
- [ ] Error messages are shown for:
  - Expired reset link
  - Invalid/used reset token
  - Password mismatch
  - Weak password (doesn't meet requirements)

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-001B  
**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()` method
- Reset token stored securely in Supabase
- Email template should include clear instructions
- Consider rate limiting for password reset requests
- Implement secure token validation
- Works for all user roles (shared functionality)

---

#### US-SA-001: Sign In as Super Admin
**As a** super admin  
**I want** to sign in to the super admin dashboard  
**So that** I can access limited administrative features

**Acceptance Criteria:**
- [ ] Super Admin can sign in using Google OAuth
- [ ] Super Admin profile is created with role = 'super_admin'
- [ ] Super Admin is redirected to super admin dashboard after sign-in
- [ ] Super Admin dashboard shows limited features (read-only analytics, no user management)
- [ ] Session is maintained across page refreshes

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** Super Admin role needs to be added to schema. Super admin dashboard UI needed with limited access.

---

#### US-SA-001A: Sign Up with Email and Password (Super Admin)
**As a** new super admin  
**I want** to create an account using my email and password  
**So that** I can access the super admin dashboard without using a social media account

**Acceptance Criteria:**
- [ ] Sign-up page/form is accessible from the sign-in page
- [ ] Form includes email and password fields
- [ ] Password field has visibility toggle (show/hide)
- [ ] Email format is validated (must be valid email format)
- [ ] Password requirements are displayed and enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- [ ] Password confirmation field is present and matches password
- [ ] Form shows real-time validation errors
- [ ] Submit button is disabled until all validations pass
- [ ] Super Admin account creation requires special invitation code or approval
- [ ] After successful sign-up, user receives email verification link
- [ ] Super Admin profile is created with `role: 'super_admin'` and `profile_completed: false`
- [ ] User is redirected to email verification page or super admin dashboard
- [ ] Error messages are displayed for duplicate emails or invalid credentials
- [ ] Success message confirms account creation
- [ ] Super Admin dashboard is only accessible after email verification

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** None  
**Technical Notes:** 
- Use Supabase Auth `signUp()` method
- Email confirmation required before full access
- Store user in `auth.users` and create corresponding `profiles` entry with `role: 'super_admin'`
- Password hashing handled by Supabase
- Super Admin accounts should be manually created by existing admins or use special invitation system
- Super Admin role must be added to database schema

---

#### US-SA-001B: Sign In with Email and Password (Super Admin)
**As a** super admin  
**I want** to sign in using my email and password  
**So that** I can access my super admin account securely

**Acceptance Criteria:**
- [ ] Sign-in page displays email and password input fields
- [ ] Email field accepts valid email format
- [ ] Password field has visibility toggle (show/hide)
- [ ] "Remember me" checkbox is available (optional)
- [ ] "Forgot Password?" link is visible and functional
- [ ] Form validates email format before submission
- [ ] Submit button is disabled if email is invalid
- [ ] Loading state is shown during authentication
- [ ] Error messages are displayed for:
  - Invalid email format
  - Incorrect password
  - Email not found
  - Unverified email (if email verification is required)
  - Account disabled/suspended
  - Insufficient permissions (non-super-admin trying to access super admin area)
- [ ] Successfully authenticated super admins are redirected to super admin dashboard (`/super-admin`)
- [ ] Session is maintained across page refreshes
- [ ] Super Admins with incomplete profiles are redirected to profile completion
- [ ] Super Admin role is verified after authentication
- [ ] Non-super-admin users are blocked from accessing super admin routes
- [ ] Super Admin dashboard shows limited features (read-only analytics, no user management)

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-SA-001A  
**Technical Notes:**
- Use Supabase Auth `signInWithPassword()` method
- Check `profile_completed` flag after authentication
- Verify `role: 'super_admin'` in profile before granting access
- Implement session management with secure cookies
- Handle email verification status
- Middleware should check super_admin role for protected routes
- Super Admin should have read-only access to analytics only

---

#### US-SA-001C: Reset Password (Super Admin)
**As a** super admin  
**I want** to reset my password when I forget it  
**So that** I can regain access to my super admin account

**Acceptance Criteria:**
- [ ] "Forgot Password?" link is visible on sign-in page
- [ ] Clicking link navigates to password reset page
- [ ] Password reset page has email input field
- [ ] Email format is validated before submission
- [ ] Submit button sends password reset email
- [ ] Success message confirms email has been sent
- [ ] Error message is shown if email is not found
- [ ] Password reset email contains secure reset link
- [ ] Reset link expires after 24 hours (configurable)
- [ ] Reset link can only be used once
- [ ] Clicking reset link navigates to password reset form
- [ ] Reset form requires:
  - New password input
  - Confirm password input
  - Password requirements displayed and enforced
- [ ] Password visibility toggles are available for both fields
- [ ] Form validates passwords match before submission
- [ ] Success message confirms password has been reset
- [ ] After successful reset, user is redirected to sign-in page
- [ ] Super Admin can sign in with new password immediately
- [ ] Old password is invalidated after reset
- [ ] Error messages are shown for:
  - Expired reset link
  - Invalid/used reset token
  - Password mismatch
  - Weak password (doesn't meet requirements)

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-SA-001B  
**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()` method
- Reset token stored securely in Supabase
- Email template should include clear instructions
- Consider rate limiting for password reset requests
- Implement secure token validation
- Works for all user roles (shared functionality)

---

### Epic 14: Admin Dashboard & Analytics

#### US-A-002: View Admin Dashboard
**As an** admin  
**I want** to view the admin dashboard  
**So that** I can see platform overview and key metrics

**Acceptance Criteria:**
- [ ] Admin dashboard displays:
  - Total users count (patients, doctors, admins)
  - Total appointments count
  - Total revenue (NGN)
  - Pending license verifications count
  - System health indicators
- [ ] Summary cards with icons and metrics
- [ ] Quick access to key sections: Users, Doctors, Appointments, Analytics
- [ ] Dashboard is responsive and loads quickly

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-001  
**Technical Notes:** Admin dashboard page needed

---

#### US-SA-002: View Super Admin Dashboard
**As a** super admin  
**I want** to view the super admin dashboard  
**So that** I can see platform analytics (read-only)

**Acceptance Criteria:**
- [ ] Super Admin dashboard displays:
  - Total users count (patients, doctors) - read-only
  - Total appointments count - read-only
  - Total revenue (NGN) - read-only
  - Platform health indicators - read-only
- [ ] Summary cards with icons and metrics (all read-only)
- [ ] Access to Analytics section only
- [ ] No access to user management, doctor verification, or system configuration
- [ ] Dashboard is responsive and loads quickly

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started  
**Dependencies:** US-SA-001  
**Technical Notes:** Super Admin dashboard page needed with limited access controls

---

#### US-A-003: View Platform Analytics
**As an** admin  
**I want** to view platform-wide analytics  
**So that** I can monitor platform health and growth

**Acceptance Criteria:**
- [ ] Analytics page shows:
  - Total users breakdown: patients, doctors, admins
  - Total appointments: scheduled, completed, cancelled
  - Revenue metrics: total revenue, average consultation fee, payment success rate
  - User growth charts over time (line/bar charts)
  - Appointment completion rate
  - Payment success rate
  - Geographic distribution of users (future)
- [ ] Charts are interactive and can be filtered by date range
- [ ] Data can be exported as CSV/PDF
- [ ] Analytics update in real-time or near real-time

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-002  
**Technical Notes:** Analytics page with charts library needed

---

#### US-SA-003: View Platform Analytics (Read-Only)
**As a** super admin  
**I want** to view platform analytics in read-only mode  
**So that** I can monitor platform metrics without modification access

**Acceptance Criteria:**
- [ ] Analytics page shows same metrics as admin (read-only):
  - Total users breakdown: patients, doctors
  - Total appointments: scheduled, completed, cancelled
  - Revenue metrics: total revenue, average consultation fee, payment success rate
  - User growth charts over time
  - Appointment completion rate
  - Payment success rate
- [ ] All data is read-only (no export, no configuration)
- [ ] Charts are view-only (no filtering or date range changes)
- [ ] No access to user management or system configuration

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-SA-002  
**Technical Notes:** Read-only analytics view with access restrictions

---

### Epic 15: Doctor Management

#### US-A-004: Verify Doctor Licenses
**As an** admin  
**I want** to verify doctor licenses  
**So that** only qualified doctors practice on the platform

**Acceptance Criteria:**
- [ ] Admin dashboard shows "Pending License Verifications" section
- [ ] List of doctors with pending verification:
  - Doctor name, email, specialty
  - License number submitted
  - Date submitted
  - License document (if uploaded)
- [ ] Admin can view license documents
- [ ] Admin can approve license verification
- [ ] Admin can reject license verification (with reason)
- [ ] Doctor receives notification when license is verified/rejected
- [ ] Only verified doctors appear in patient booking
- [ ] Verification history is logged

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-D-002, US-A-002  
**Technical Notes:** License verification UI and workflow needed

---

#### US-A-005: View All Doctors
**As an** admin  
**I want** to view all doctors on the platform  
**So that** I can manage doctor accounts

**Acceptance Criteria:**
- [ ] Doctors page lists all doctors:
  - Doctor name, email, specialty
  - License verification status
  - Total appointments
  - Account status (active, suspended)
- [ ] Doctors can be filtered by:
  - Verification status (verified, pending, rejected)
  - Specialty
  - Account status
- [ ] Doctors can be searched by name or email
- [ ] Clicking doctor shows detailed profile
- [ ] Actions available: View Profile, Suspend Account, Verify License

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-002  
**Technical Notes:** Doctors management page needed

---

#### US-A-006: Manage Doctor Accounts
**As an** admin  
**I want** to manage doctor accounts  
**So that** I can handle support issues and maintain platform quality

**Acceptance Criteria:**
- [ ] Admin can view doctor profile details
- [ ] Admin can suspend/activate doctor accounts
- [ ] Admin can view doctor activity logs
- [ ] Admin can reset doctor passwords
- [ ] Admin can delete doctor accounts (with proper authorization and confirmation)
- [ ] Suspended doctors cannot access platform
- [ ] Account changes are logged in audit trail
- [ ] Doctor receives notification of account status changes

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-005  
**Technical Notes:** Account management actions and confirmation dialogs needed

---

### Epic 16: Patient Management

#### US-A-007: View All Patients
**As an** admin  
**I want** to view all patients on the platform  
**So that** I can manage patient accounts

**Acceptance Criteria:**
- [ ] Patients page lists all patients:
  - Patient name, email, age, gender
  - Total appointments
  - Account status (active, suspended)
  - Profile completion status
- [ ] Patients can be filtered by:
  - Account status
  - Profile completion
  - Registration date
- [ ] Patients can be searched by name or email
- [ ] Clicking patient shows detailed profile
- [ ] Actions available: View Profile, Suspend Account, Reset Password

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-002  
**Technical Notes:** Patients management page needed

---

#### US-A-008: Manage Patient Accounts
**As an** admin  
**I want** to manage patient accounts  
**So that** I can handle support issues

**Acceptance Criteria:**
- [ ] Admin can view patient profile details
- [ ] Admin can suspend/activate patient accounts
- [ ] Admin can view patient activity logs
- [ ] Admin can reset patient passwords
- [ ] Admin can delete patient accounts (with proper authorization and confirmation)
- [ ] Suspended patients cannot access platform
- [ ] Account changes are logged in audit trail
- [ ] Patient receives notification of account status changes

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-007  
**Technical Notes:** Account management actions and confirmation dialogs needed

---

### Epic 17: Appointment Management

#### US-A-009: View All Appointments
**As an** admin  
**I want** to view all appointments on the platform  
**So that** I can monitor appointment activity

**Acceptance Criteria:**
- [ ] Appointments page lists all appointments:
  - Patient name, Doctor name
  - Date and time
  - Status (scheduled, confirmed, in_progress, completed, cancelled)
  - Payment status
  - Consultation fee
- [ ] Appointments can be filtered by:
  - Status
  - Date range
  - Doctor
  - Patient
  - Payment status
- [ ] Appointments can be searched by patient/doctor name
- [ ] Clicking appointment shows detailed information
- [ ] Actions available: View Details, Cancel Appointment (with reason)

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-002  
**Technical Notes:** Appointments management page needed

---

#### US-A-010: Monitor Appointment Issues
**As an** admin  
**I want** to monitor appointment issues  
**So that** I can resolve conflicts and support users

**Acceptance Criteria:**
- [ ] Admin can view appointment details
- [ ] Admin can cancel appointments (with reason and notification)
- [ ] Admin can view appointment history and changes
- [ ] Admin can see payment issues and failed transactions
- [ ] Admin can view reschedule requests
- [ ] Admin can resolve appointment disputes
- [ ] All actions are logged in audit trail

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-009  
**Technical Notes:** Appointment management actions needed

---

### Epic 18: System Management

#### US-A-011: Monitor System Health
**As an** admin  
**I want** to monitor system health and errors  
**So that** I can ensure platform reliability

**Acceptance Criteria:**
- [ ] System Health page displays:
  - Error logs with timestamps and details
  - System uptime percentage
  - API response times (average, p95, p99)
  - Failed payment attempts count
  - Database connection status
  - Video call success rate
- [ ] Critical errors trigger alerts (email/SMS)
- [ ] Error logs can be filtered by:
  - Error type
  - Date range
  - Severity
- [ ] Error logs can be exported
- [ ] System metrics are updated in real-time or near real-time

**Priority:** P2 (Medium)  
**Status:** 🟡 In Progress  
**Dependencies:** US-A-002  
**Technical Notes:** Sentry is integrated for error tracking. System health dashboard needed.

---

#### US-A-012: View Audit Logs
**As an** admin  
**I want** to view audit logs  
**So that** I can track all platform activities and ensure compliance

**Acceptance Criteria:**
- [ ] Audit Logs page displays:
  - All database queries accessing PHI
  - Authentication events (logins, logouts)
  - Data access events (appointments, notes, prescriptions)
  - Admin actions (user management, license verification)
  - Payment transactions
- [ ] Logs show: timestamp, user, action, resource, IP address
- [ ] Logs can be filtered by:
  - User
  - Action type
  - Date range
  - Resource type
- [ ] Logs can be searched
- [ ] Logs can be exported for compliance reporting
- [ ] Logs are retained according to retention policy

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-002  
**Technical Notes:** Audit logging table exists, audit logs UI needed

---

#### US-A-013: Manage System Configuration
**As an** admin  
**I want** to manage system configuration  
**So that** I can configure platform settings

**Acceptance Criteria:**
- [ ] System Configuration page allows:
  - Setting default consultation fees
  - Configuring notification templates
  - Managing platform announcements
  - Setting maintenance mode
  - Configuring payment gateway settings
  - Managing feature flags
- [ ] Changes require confirmation
- [ ] Configuration changes are logged
- [ ] Configuration can be exported/imported
- [ ] System-wide notifications can be sent to users

**Priority:** P3 (Low)  
**Status:** ❌ Not Started  
**Dependencies:** US-A-002  
**Technical Notes:** System configuration UI and storage needed

---

### Epic 19: Super Admin Limited Access

#### US-SA-004: View Read-Only Analytics
**As a** super admin  
**I want** to view platform analytics in read-only mode  
**So that** I can monitor metrics without modification capabilities

**Acceptance Criteria:**
- [ ] Super Admin can view all analytics metrics (same as admin)
- [ ] All data is read-only (no export, no configuration changes)
- [ ] No access to user management pages
- [ ] No access to doctor verification
- [ ] No access to system configuration
- [ ] No access to audit logs
- [ ] Access is restricted via role-based permissions

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-SA-002  
**Technical Notes:** Role-based access control (RBAC) needed to restrict super admin access

---

#### US-SA-005: View System Health (Read-Only)
**As a** super admin  
**I want** to view system health metrics in read-only mode  
**So that** I can monitor system status

**Acceptance Criteria:**
- [ ] Super Admin can view:
  - System uptime (read-only)
  - Error count (read-only)
  - API response times (read-only)
- [ ] Cannot view detailed error logs
- [ ] Cannot configure system settings
- [ ] Cannot access audit logs
- [ ] Access is restricted via role-based permissions

**Priority:** P2 (Medium)  
**Status:** ❌ Not Started  
**Dependencies:** US-SA-002  
**Technical Notes:** Read-only system health view with access restrictions

---

## Epic Summary

### Completed Epics (✅)
1. **Landing Page** - US-LP-001
2. **Patient Authentication & Basic Profile** - US-P-001, US-P-002, US-P-003
3. **Appointment Viewing** - US-P-008
4. **Video Consultation Infrastructure** - Components created, integration pending
5. **Consultation Notes Viewing** - US-P-013
6. **Investigation Results Viewing** - US-P-015
7. **Patient Dashboard** - US-P-019
8. **Doctor Authentication & Profile** - US-D-001, US-D-002
9. **Doctor Appointment Management** - US-D-004
10. **Doctor Dashboard** - US-D-016
11. **SOAP Notes Form** - US-D-008 (form exists, needs prescription connection)
12. **Doctor Patient Management** - US-D-012

### In Progress Epics (🟡)
1. **Payment Integration** - US-P-007 (payment APIs exist, callback needed)
2. **Video Consultation Integration** - US-P-011, US-D-006 (components exist, not connected)
3. **Profile Updates** - US-P-004, US-D-003 (photo upload needed)
4. **Appointment Details** - US-D-005
5. **Notifications** - US-P-016, US-D-017
6. **Patient Medical History** - US-D-013 (needs expansion)
7. **System Health Monitoring** - US-A-011 (Sentry integrated, dashboard needed)

### Not Started Epics (❌)
1. **Doctor Selection/Browsing** - US-P-005 (CRITICAL - blocks booking)
2. **Appointment Booking Flow** - US-P-006 (needs calendar, order summary)
3. **Appointment Rescheduling** - US-P-009
4. **Appointment Cancellation** - US-P-010
5. **Prescription System** - US-P-014, US-D-009
6. **Investigation Upload** - US-P-015A (patient upload functionality)
7. **Investigation Requests** - US-D-010, US-D-011
8. **Session Notes Upload** - US-D-019 (doctor upload functionality)
9. **Real-time Messaging** - US-P-017, US-D-018
10. **Notification UI** - US-P-018
11. **Settings & Preferences** - US-P-020, US-P-021, US-P-022, US-D-020, US-D-021, US-D-022
12. **Availability Management** - US-D-014, US-D-015
13. **Admin Features** - All admin stories (US-A-001 through US-A-013)
14. **Super Admin Features** - All super admin stories (US-SA-001 through US-SA-005)

---

## Priority Summary

### P0 (Critical - Blocks MVP)
- US-LP-001: View Landing Page ✅
- US-P-005: Browse Available Doctors ⚠️
- US-P-006: Book an Appointment ⚠️
- US-P-007: Pay for Appointment 🟡
- US-P-011: Join Video Consultation 🟡
- US-D-005: View Appointment Details 🟡
- US-D-006: Join Video Consultation 🟡
- US-A-001: Sign In as Admin ❌
- US-SA-001: Sign In as Super Admin ❌

### P1 (High Priority)
- US-P-004: Update My Profile 🟡
- US-P-009: Reschedule Appointment ❌
- US-P-014: View Prescriptions ❌
- US-P-015A: Upload Investigation Results ❌
- US-P-016: Receive Notifications 🟡
- US-P-018: View Notifications ❌
- US-P-020: Access Settings & Preferences ❌
- US-P-021: Manage Notification Preferences ❌
- US-P-022: Manage Account Settings ❌
- US-D-003: Update Doctor Profile ❌
- US-D-007: Update Appointment Status 🟡
- US-D-009: Create Prescription ❌
- US-D-010: Request Investigation ❌
- US-D-013: View Patient History 🟡
- US-D-017: Receive Notifications 🟡
- US-D-019: Upload Session Notes ❌
- US-D-020: Access Settings & Preferences ❌
- US-D-021: Manage Doctor Notification Preferences ❌
- US-D-022: Manage Doctor Account Settings ❌
- US-A-002: View Admin Dashboard ❌
- US-SA-002: View Super Admin Dashboard ❌

### P2 (Medium Priority)
- US-P-017: Message Doctor ❌
- US-D-014: Set Availability ❌
- US-D-015: View Schedule ❌
- US-D-018: Message Patients ❌
- US-A-003: View Platform Analytics ❌
- US-A-004: Verify Doctor Licenses ❌
- US-A-005: View All Doctors ❌
- US-A-006: Manage Doctor Accounts ❌
- US-A-007: View All Patients ❌
- US-A-008: Manage Patient Accounts ❌
- US-A-009: View All Appointments ❌
- US-A-010: Monitor Appointment Issues ❌
- US-A-011: Monitor System Health 🟡
- US-A-012: View Audit Logs ❌
- US-SA-003: View Platform Analytics (Read-Only) ❌
- US-SA-004: View Read-Only Analytics ❌
- US-SA-005: View System Health (Read-Only) ❌

### P3 (Low Priority)
- US-A-013: Manage System Configuration ❌

---

## Implementation Roadmap

### Phase 1: Complete Core Booking Flow (Week 1-2)
**Goal:** Enable end-to-end appointment booking

1. US-P-005: Browse Available Doctors
2. US-P-006: Book an Appointment (fix doctor selection)
3. US-P-007: Pay for Appointment (add callback route)
4. US-P-011: Join Video Consultation (integrate video component)

**Outcome:** Patients can browse doctors, book appointments, pay, and join video calls

---

### Phase 2: Complete Consultation Workflow (Week 3)
**Goal:** Enable full consultation documentation

1. US-D-005: View Appointment Details
2. US-D-006: Join Video Consultation (doctor side)
3. US-D-009: Create Prescription
4. US-D-010: Request Investigation

**Outcome:** Doctors can conduct consultations and create all documentation

---

### Phase 3: Enhance User Experience (Week 4)
**Goal:** Improve communication and notifications

1. US-P-016: Receive Notifications (connect to events)
2. US-P-018: View Notifications UI
3. US-P-009: Reschedule Appointment
4. US-P-004: Update Profile

**Outcome:** Users have better communication and profile management

---

### Phase 4: Advanced Features (Week 5+)
**Goal:** Add convenience features

1. US-D-014: Set Availability
2. US-P-017: Message Doctor
3. US-P-014: View Prescriptions
4. Admin features (if needed)

**Outcome:** Platform has advanced scheduling and communication features

---

## Implementation Tasks

This section breaks down each user story into specific, actionable implementation tasks. Tasks are organized by priority and include UI components, API routes, database changes, and integration work.

### Phase 1: Core Booking Flow (P0 - Critical)

#### Task Set 1.1: Enhance Appointment Booking Flow (US-P-006)

**Status:** ⚠️ Needs Work  
**Estimated Time:** 2-3 days  
**Assignee:** TBD

**Tasks:**

1. **Create Calendar Date Picker Component**
   - [ ] Create `components/ui/calendar.tsx` or `components/ui/date-picker.tsx`
   - [ ] Use react-day-picker or similar library for better UX
   - [ ] Support date selection with disabled dates (past dates, doctor unavailability)
   - [ ] Show available time slots for selected date
   - [ ] Mobile responsive design
   - [ ] Accessibility (keyboard navigation, ARIA labels)

2. **Create Progress Indicator Component**
   - [ ] Create `components/ui/progress-indicator.tsx`
   - [ ] Show current step, completed steps, total steps
   - [ ] Step labels: "Enter Details", "Select Doctor", "Schedule & Pay"
   - [ ] Visual indicators (checkmarks for completed, current step highlighted)
   - [ ] Mobile-friendly layout

3. **Enhance Doctor Selection UI**
   - [ ] Improve `components/patient/doctor-card.tsx` with better visual design
   - [ ] Add doctor photos/avatars
   - [ ] Show consultation fee prominently
   - [ ] Add "Select" button with hover effects
   - [ ] Loading states for doctor data
   - [ ] Error states (no doctors available)

4. **Create Order Summary Component**
   - [ ] Create `components/patient/order-summary-card.tsx`
   - [ ] Display: Doctor name, specialty, date, time, consultation fee
   - [ ] Show formatted currency (NGN)
   - [ ] Allow editing date/time before checkout
   - [ ] Visual hierarchy (important info prominent)

5. **Enhance Booking Form Multi-Step Flow**
   - [ ] Update `components/patient/book-appointment-form.tsx`
   - [ ] Integrate progress indicator
   - [ ] Add back button (step 2 & 3)
   - [ ] Add step validation with error messages
   - [ ] Improve date/time selection UI (use new calendar component)
   - [ ] Add confirmation step before payment

6. **Integration & Testing**
   - [ ] Test complete booking flow end-to-end
   - [ ] Test error handling (network errors, validation errors)
   - [ ] Test on mobile devices
   - [ ] Accessibility testing

**Dependencies:** None  
**Related Files:**
- `components/patient/book-appointment-form.tsx`
- `components/patient/doctor-list.tsx`
- `components/patient/doctor-card.tsx`

---

#### Task Set 1.2: Payment Callback Implementation (US-P-007)

**Status:** 🟡 In Progress  
**Estimated Time:** 1 day  
**Assignee:** TBD

**Tasks:**

1. **Create Payment Callback Route**
   - [ ] Create `app/payment/callback/route.ts`
   - [ ] Handle Paystack callback with reference parameter
   - [ ] Verify payment status with Paystack API
   - [ ] Update appointment status to "confirmed" on success
   - [ ] Update payment_status to "paid"
   - [ ] Handle failed payments (update status, notify user)
   - [ ] Redirect to appropriate page (success/failure)

2. **Add Payment Verification Logic**
   - [ ] Use Paystack verification API
   - [ ] Validate payment reference
   - [ ] Check amount matches appointment fee
   - [ ] Prevent duplicate verification
   - [ ] Error handling and logging

3. **Update Payment Flow**
   - [ ] Update `components/patient/book-appointment-form.tsx`
   - [ ] Ensure callback URL is correctly set
   - [ ] Add loading state during payment processing
   - [ ] Show success/error messages after callback

4. **Testing**
   - [ ] Test successful payment flow
   - [ ] Test failed payment flow
   - [ ] Test payment callback with invalid reference
   - [ ] Test duplicate payment attempts

**Dependencies:** Task Set 1.1  
**Related Files:**
- `app/payment/callback/route.ts` (new)
- `lib/paystack/client.ts`
- `components/patient/book-appointment-form.tsx`

---

#### Task Set 1.3: Video Consultation Integration (US-P-011, US-D-006)

**Status:** 🟡 In Progress  
**Estimated Time:** 2-3 days  
**Assignee:** TBD

**Tasks:**

1. **Create Video Call Page (Patient)**
   - [ ] Create `app/(dashboard)/patient/appointments/[id]/join/page.tsx`
   - [ ] Fetch appointment details
   - [ ] Check appointment status and time (allow join 15 min before)
   - [ ] Create Daily.co room if not exists
   - [ ] Generate secure token
   - [ ] Load video interface component
   - [ ] Handle errors (appointment not found, not time yet, etc.)

2. **Create Video Call Page (Doctor)**
   - [ ] Create `app/(dashboard)/doctor/appointments/[id]/join/page.tsx`
   - [ ] Similar functionality as patient page
   - [ ] Doctor-specific permissions (if any)

3. **Enhance Video Interface Component**
   - [ ] Update `components/video/call-interface.tsx`
   - [ ] Add appointment status update on join
   - [ ] Update status to "in_progress" when call starts
   - [ ] Handle call end (update to "completed")
   - [ ] Show appointment details (patient/doctor name)
   - [ ] Error handling and reconnection logic

4. **Auto-create Video Room on Payment**
   - [ ] Update payment callback to create room
   - [ ] Store room name/URL in appointment record
   - [ ] Or create room on-demand when user clicks "Join"

5. **Add Join Button to Appointment Cards**
   - [ ] Update `components/patient/appointment-card.tsx`
   - [ ] Show "Join Consultation" button for confirmed appointments
   - [ ] Only show button 15 minutes before appointment time
   - [ ] Update `components/doctor/client-card.tsx` or appointment card

6. **Testing**
   - [ ] Test room creation
   - [ ] Test token generation
   - [ ] Test video call flow (both patient and doctor)
   - [ ] Test appointment status updates
   - [ ] Test error scenarios

**Dependencies:** Task Set 1.2  
**Related Files:**
- `app/(dashboard)/patient/appointments/[id]/join/page.tsx` (new)
- `app/(dashboard)/doctor/appointments/[id]/join/page.tsx` (new)
- `components/video/call-interface.tsx`
- `app/api/daily/create-room/route.ts`
- `app/api/daily/get-token/route.ts`

---

### Phase 2: Consultation Documentation (P0-P1)

#### Task Set 2.1: Appointment Details Page (US-D-005)

**Status:** ❌ Not Started  
**Estimated Time:** 2 days  
**Assignee:** TBD

**Tasks:**

1. **Create Appointment Detail Page**
   - [ ] Create `app/(dashboard)/doctor/appointments/[id]/page.tsx`
   - [ ] Fetch appointment with patient details
   - [ ] Display patient demographics
   - [ ] Show appointment information (date, time, status, payment)
   - [ ] Display chief complaint and symptoms

2. **Patient Medical History Section**
   - [ ] Fetch all previous appointments with this patient
   - [ ] Display consultation history
   - [ ] Link to previous SOAP notes
   - [ ] Show prescription history
   - [ ] Show investigation history

3. **Action Buttons**
   - [ ] "Join Consultation" button (if time)
   - [ ] "Add Notes" button (after consultation)
   - [ ] "Create Prescription" button (after consultation)
   - [ ] "Request Investigation" button (after consultation)

4. **UI Components**
   - [ ] Patient demographics card (reuse existing)
   - [ ] Appointment info card
   - [ ] Medical history timeline/cards
   - [ ] Action button group

5. **Testing**
   - [ ] Test page loads with valid appointment ID
   - [ ] Test error handling (invalid ID, unauthorized access)
   - [ ] Test action buttons functionality
   - [ ] Test medical history display

**Dependencies:** None  
**Related Files:**
- `app/(dashboard)/doctor/appointments/[id]/page.tsx` (new)
- `components/dashboard/patient-demographics.tsx`

---

#### Task Set 2.2: Prescription Creation (US-D-009)

**Status:** ❌ Not Started  
**Estimated Time:** 3 days  
**Assignee:** TBD

**Tasks:**

1. **Create Prescription Form Component**
   - [ ] Create `components/doctor/prescription-form.tsx`
   - [ ] Fields: Medication name, dosage, frequency, duration, instructions
   - [ ] Support multiple medications (add/remove)
   - [ ] Refills field (optional)
   - [ ] Validation (required fields, dosage format)
   - [ ] Link to appointment ID

2. **Create Prescription Page**
   - [ ] Create `app/(dashboard)/doctor/appointments/[id]/prescription/page.tsx`
   - [ ] Or create as modal/dialog
   - [ ] Load appointment details
   - [ ] Display prescription form
   - [ ] Submit to create prescription record

3. **Prescription API/Server Action**
   - [ ] Create API route or Server Action for prescription creation
   - [ ] Validate data
   - [ ] Create prescription record in database
   - [ ] Link to appointment and patient
   - [ ] Set status to "active"
   - [ ] Calculate expiration date

4. **Notification Integration**
   - [ ] Send notification to patient when prescription created
   - [ ] Email notification (via Brevo)
   - [ ] SMS notification (via Twilio)
   - [ ] In-app notification

5. **Update SOAP Form Integration**
   - [ ] Update `components/consultation/soap-form.tsx`
   - [ ] Add "Create Prescription" button/link
   - [ ] Pass appointment ID to prescription form
   - [ ] Or integrate prescription creation into SOAP form

6. **Testing**
   - [ ] Test prescription creation
   - [ ] Test validation
   - [ ] Test notification delivery
   - [ ] Test prescription linking to appointment

**Dependencies:** Task Set 2.1  
**Related Files:**
- `components/doctor/prescription-form.tsx` (new)
- `app/(dashboard)/doctor/appointments/[id]/prescription/page.tsx` (new)
- `components/consultation/soap-form.tsx`
- `lib/notifications/create.ts`

---

#### Task Set 2.3: Investigation Request (US-D-010)

**Status:** ❌ Not Started  
**Estimated Time:** 2-3 days  
**Assignee:** TBD

**Tasks:**

1. **Create Investigation Request Form**
   - [ ] Create `components/doctor/investigation-request-form.tsx`
   - [ ] Fields: Test name, test type, special instructions
   - [ ] Support multiple investigations (add/remove)
   - [ ] Test name suggestions/autocomplete
   - [ ] Validation

2. **Create Investigation Request Page**
   - [ ] Create `app/(dashboard)/doctor/appointments/[id]/investigation/page.tsx`
   - [ ] Or create as modal/dialog
   - [ ] Load appointment details
   - [ ] Display form
   - [ ] Submit to create investigation record

3. **Investigation API/Server Action**
   - [ ] Create API route or Server Action
   - [ ] Validate data
   - [ ] Create investigation record
   - [ ] Link to appointment and patient
   - [ ] Set status to "requested"

4. **Notification Integration**
   - [ ] Send notification to patient
   - [ ] Email and SMS notifications
   - [ ] Include investigation details in notification

5. **Integration with Appointment Details**
   - [ ] Add "Request Investigation" button to appointment detail page
   - [ ] Link to investigation form/page

6. **Testing**
   - [ ] Test investigation creation
   - [ ] Test validation
   - [ ] Test notification delivery

**Dependencies:** Task Set 2.1  
**Related Files:**
- `components/doctor/investigation-request-form.tsx` (new)
- `app/(dashboard)/doctor/appointments/[id]/investigation/page.tsx` (new)

---

### Phase 3: Settings & Preferences (P1)

#### Task Set 3.1: Settings Pages (US-P-020, US-D-020)

**Status:** ❌ Not Started  
**Estimated Time:** 3-4 days  
**Assignee:** TBD

**Tasks:**

1. **Create Settings Layout Component**
   - [ ] Create `components/settings/settings-layout.tsx`
   - [ ] Sub-navigation tabs: Notifications, Account
   - [ ] Active tab highlighting
   - [ ] Mobile responsive

2. **Create Settings Navigation Component**
   - [ ] Create `components/settings/settings-nav.tsx`
   - [ ] Tab links: Notifications, Account
   - [ ] Icon indicators
   - [ ] Active state styling

3. **Create Patient Settings Pages**
   - [ ] Create `app/(dashboard)/patient/settings/page.tsx` (redirects to notifications)
   - [ ] Create `app/(dashboard)/patient/settings/notifications/page.tsx`
   - [ ] Create `app/(dashboard)/patient/settings/account/page.tsx`

4. **Create Doctor Settings Pages**
   - [ ] Create `app/(dashboard)/doctor/settings/page.tsx`
   - [ ] Create `app/(dashboard)/doctor/settings/notifications/page.tsx`
   - [ ] Create `app/(dashboard)/doctor/settings/account/page.tsx`

5. **Create Toggle Switch Component**
   - [ ] Create `components/ui/switch.tsx` or `components/ui/toggle.tsx`
   - [ ] Use Radix UI Switch primitive
   - [ ] Accessible (keyboard navigation, ARIA)
   - [ ] Styled with Tailwind

6. **Notification Preferences UI**
   - [ ] Create `components/settings/notification-preferences.tsx`
   - [ ] Toggle switches for:
     - Email notifications
     - SMS notifications
     - In-app notifications
   - [ ] Per-category preferences (appointments, prescriptions, investigations, messages)
   - [ ] Save preferences functionality

7. **Account Settings UI**
   - [ ] Create `components/settings/account-settings.tsx`
   - [ ] Change password (if applicable)
   - [ ] Sign out button
   - [ ] Delete account button (with confirmation)
   - [ ] Danger zone styling

8. **Save Preferences Logic**
   - [ ] Create API route or Server Action for saving preferences
   - [ ] Store in user profile or preferences table
   - [ ] Update notification logic to check preferences

9. **Testing**
   - [ ] Test settings navigation
   - [ ] Test preference toggles
   - [ ] Test saving preferences
   - [ ] Test account actions (sign out, delete)

**Dependencies:** None  
**Related Files:**
- `app/(dashboard)/patient/settings/**/*` (new)
- `app/(dashboard)/doctor/settings/**/*` (new)
- `components/settings/**/*` (new)
- `components/ui/switch.tsx` (new)

---

#### Task Set 3.2: File Upload Component (US-P-015A, US-D-019)

**Status:** ❌ Not Started  
**Estimated Time:** 2 days  
**Assignee:** TBD

**Tasks:**

1. **Create File Upload Component**
   - [ ] Create `components/ui/file-upload.tsx`
   - [ ] Support drag-and-drop
   - [ ] Support click to browse
   - [ ] File type validation (PDF, images for investigations)
   - [ ] File size validation
   - [ ] Preview uploaded files
   - [ ] Remove file functionality
   - [ ] Loading state during upload
   - [ ] Error handling

2. **Investigation Results Upload (Patient)**
   - [ ] Create `app/(dashboard)/patient/investigations/[id]/upload/page.tsx`
   - [ ] Or create upload modal/dialog
   - [ ] Load investigation details
   - [ ] Display file upload component
   - [ ] Upload to Supabase Storage
   - [ ] Update investigation record with file URL
   - [ ] Update status to "completed"

3. **Session Notes Upload (Doctor)**
   - [ ] Add upload functionality to client detail page
   - [ ] Similar upload flow
   - [ ] Store in appropriate location

4. **Supabase Storage Configuration**
   - [ ] Configure storage buckets (if needed)
   - [ ] Set up RLS policies for file access
   - [ ] Set up file organization structure

5. **Testing**
   - [ ] Test file upload (different file types)
   - [ ] Test file validation
   - [ ] Test Supabase Storage integration
   - [ ] Test error handling

**Dependencies:** None  
**Related Files:**
- `components/ui/file-upload.tsx` (new)
- `app/(dashboard)/patient/investigations/[id]/upload/page.tsx` (new)

---

#### Task Set 3.3: Notifications UI (US-P-018, US-D-021)

**Status:** ❌ Not Started  
**Estimated Time:** 2-3 days  
**Assignee:** TBD

**Tasks:**

1. **Enhance Notification Bell Component**
   - [ ] Update `components/notifications/notification-bell.tsx`
   - [ ] Add dropdown menu on click
   - [ ] Show recent notifications (5-10)
   - [ ] Show unread count badge
   - [ ] "Mark as read" functionality
   - [ ] "View all" link

2. **Create Notifications Dropdown**
   - [ ] Create `components/notifications/notification-dropdown.tsx`
   - [ ] List notifications with:
     - Icon (type-based)
     - Title
     - Preview text
     - Timestamp
     - Unread indicator
   - [ ] Click notification to navigate to related page
   - [ ] Empty state

3. **Create Notifications Page**
   - [ ] Create `app/(dashboard)/patient/notifications/page.tsx`
   - [ ] Create `app/(dashboard)/doctor/notifications/page.tsx`
   - [ ] Full list of notifications
   - [ ] Filter by type
   - [ ] Mark all as read
   - [ ] Pagination or infinite scroll

4. **Real-time Updates**
   - [ ] Integrate Supabase Realtime or SSE
   - [ ] Update notification count in real-time
   - [ ] Add new notifications to dropdown/page in real-time

5. **Notification Types & Icons**
   - [ ] Appointment notifications (calendar icon)
   - [ ] Prescription notifications (pill icon)
   - [ ] Investigation notifications (file icon)
   - [ ] Message notifications (message icon)
   - [ ] System notifications (bell icon)

6. **Testing**
   - [ ] Test notification dropdown
   - [ ] Test real-time updates
   - [ ] Test mark as read
   - [ ] Test navigation on click

**Dependencies:** None  
**Related Files:**
- `components/notifications/notification-bell.tsx`
- `components/notifications/notification-dropdown.tsx` (new)
- `app/(dashboard)/patient/notifications/page.tsx` (new)
- `app/(dashboard)/doctor/notifications/page.tsx` (new)

---

### Phase 4: Additional Features (P1-P2)

#### Task Set 4.1: Prescriptions View (US-P-014)

**Status:** ❌ Not Started  
**Estimated Time:** 1-2 days  
**Assignee:** TBD

**Tasks:**

1. **Create Prescriptions Page**
   - [ ] Create `app/(dashboard)/patient/prescriptions/page.tsx`
   - [ ] Fetch all prescriptions for patient
   - [ ] Filter by status (active, filled, expired)
   - [ ] Sort by date (newest first)

2. **Prescription Card Component**
   - [ ] Create `components/patient/prescription-card.tsx`
   - [ ] Display: Date, doctor name, medications list, status
   - [ ] Expandable details
   - [ ] Print/download functionality (future)

3. **Prescription Detail View**
   - [ ] Create `app/(dashboard)/patient/prescriptions/[id]/page.tsx`
   - [ ] Full prescription details
   - [ ] All medications with dosages
   - [ ] Instructions
   - [ ] Expiration date
   - [ ] Refills remaining

4. **Testing**
   - [ ] Test prescriptions list
   - [ ] Test filtering
   - [ ] Test detail view

**Dependencies:** Task Set 2.2  
**Related Files:**
- `app/(dashboard)/patient/prescriptions/page.tsx` (new)
- `components/patient/prescription-card.tsx` (new)

---

#### Task Set 4.2: Reschedule Appointment (US-P-009)

**Status:** ❌ Not Started  
**Estimated Time:** 1-2 days  
**Assignee:** TBD

**Tasks:**

1. **Integrate Reschedule Dialog**
   - [ ] Update `components/patient/appointment-card.tsx`
   - [ ] Add "Reschedule" button for confirmed appointments
   - [ ] Show reschedule dialog component (already exists)
   - [ ] Check reschedule policy (e.g., 24 hours before)

2. **Update Reschedule Dialog**
   - [ ] Update `components/patient/reschedule-appointment-dialog.tsx`
   - [ ] Improve date/time selection (use calendar component)
   - [ ] Add doctor availability check
   - [ ] Add confirmation step
   - [ ] Success/error handling

3. **Reschedule API/Server Action**
   - [ ] Create API route or Server Action
   - [ ] Validate new date/time
   - [ ] Check doctor availability
   - [ ] Update appointment record
   - [ ] Send notifications (patient and doctor)

4. **Testing**
   - [ ] Test reschedule flow
   - [ ] Test availability validation
   - [ ] Test notification delivery

**Dependencies:** Task Set 1.1  
**Related Files:**
- `components/patient/reschedule-appointment-dialog.tsx`
- `components/patient/appointment-card.tsx`

---

### UI Component Creation Checklist

The following UI components need to be created based on the user journey analysis:

#### High Priority Components

1. **Calendar/Date Picker Component**
   - [ ] `components/ui/calendar.tsx` or `components/ui/date-picker.tsx`
   - [ ] Library: react-day-picker or @radix-ui/react-calendar
   - [ ] Features: Date selection, disabled dates, time slots

2. **File Upload Component**
   - [ ] `components/ui/file-upload.tsx`
   - [ ] Features: Drag-and-drop, file validation, preview, progress

3. **Toggle Switch Component**
   - [ ] `components/ui/switch.tsx`
   - [ ] Library: @radix-ui/react-switch
   - [ ] Features: Accessible, styled, on/off states

4. **Progress Indicator Component**
   - [ ] `components/ui/progress-indicator.tsx` or `components/ui/stepper.tsx`
   - [ ] Features: Steps, current step, completed steps

5. **Settings Navigation Component**
   - [ ] `components/settings/settings-nav.tsx`
   - [ ] Features: Tab navigation, active state, icons

6. **Notification Dropdown Component**
   - [ ] `components/notifications/notification-dropdown.tsx`
   - [ ] Features: Notification list, mark as read, navigation

7. **Order Summary Card Component**
   - [ ] `components/patient/order-summary-card.tsx`
   - [ ] Features: Appointment summary, pricing, confirmation

#### Medium Priority Components

8. **Prescription Card Component**
   - [ ] `components/patient/prescription-card.tsx`
   - [ ] Features: Prescription details, status, actions

9. **Investigation Card Component**
   - [ ] Enhance existing `components/patient/investigation-card.tsx`
   - [ ] Features: Upload button, status, details

10. **Profile Photo Upload Component**
    - [ ] Enhance profile forms with photo upload
    - [ ] Features: Image preview, crop, upload to Supabase Storage

---

## Notes

- **Status Legend:**
  - ✅ Complete: Feature is implemented and working
  - 🟡 In Progress: Partially implemented or needs integration
  - ❌ Not Started: Not yet implemented
  - ⚠️ Needs Work: Implemented but has critical gaps

- **Dependencies:** Stories should be implemented in order when dependencies are listed

- **Testing:** Each user story should have corresponding test cases (unit, integration, E2E)

- **Documentation:** Implementation of each story should include code comments and API documentation updates

- **Task Estimation:** All time estimates are in developer days. Adjust based on team velocity and experience.

- **Assignment:** Assign tasks to team members based on expertise and availability.

---

**Document Status:** Active  
**Next Review:** After Phase 1 completion  
**Owner:** Product Team
