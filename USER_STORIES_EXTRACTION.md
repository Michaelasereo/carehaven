# User Stories Extraction from UI Images - Care Haven

**Document Version:** 1.0  
**Date:** January 2025  
**Source:** UI Screenshots Analysis  
**Purpose:** Extract user stories from visual designs and compare with existing documentation

---

## Table of Contents
1. [Patient User Stories from Images](#patient-user-stories-from-images)
2. [Doctor User Stories from Images](#doctor-user-stories-from-images)
3. [Landing Page Features](#landing-page-features)
4. [Comparison with Existing USER_STORIES.md](#comparison-with-existing-user_storiesmd)
5. [Missing User Stories](#missing-user-stories)
6. [Additional Features Identified](#additional-features-identified)

---

## Patient User Stories from Images

### Epic: Dashboard & Overview

#### US-P-IMG-001: View Dashboard with Summary Metrics
**As a** patient  
**I want** to view my dashboard with key healthcare metrics  
**So that** I can quickly understand my health activity status

**Acceptance Criteria:**
- [ ] Dashboard displays three summary cards:
  - Total Consultations (with count, e.g., "06")
  - Upcoming Appointments (with count, e.g., "32")
  - Investigations (with count, e.g., "02")
- [ ] Patient demographics card shows: Name, Age, Sex, Occupation, Marital Status
- [ ] Upcoming Appointments section lists next appointments
- [ ] Each appointment card shows: doctor name, time range, description
- [ ] Dashboard is responsive and loads quickly

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-P-019 but with more specific UI details

---

#### US-P-IMG-002: View Upcoming Appointments on Dashboard
**As a** patient  
**I want** to see my upcoming appointments on the dashboard  
**So that** I can quickly see what consultations are scheduled

**Acceptance Criteria:**
- [ ] Upcoming appointments section displays appointment cards
- [ ] Each card shows: "Consultation with Dr [Name]", time range (e.g., "10AM - 11AM")
- [ ] Cards have action buttons (circular arrow icon) to view details
- [ ] Appointments are sorted by date (upcoming first)
- [ ] Empty state shown when no appointments

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Part of US-P-008, but UI details are more specific

---

### Epic: Appointment Booking

#### US-P-IMG-003: Book Appointment - Multi-Step Process
**As a** patient  
**I want** to book an appointment through a guided multi-step process  
**So that** I can complete booking without confusion

**Acceptance Criteria:**
- [ ] Step 1: Enter Details - Form with personal and consultation information
  - Fields: First Name, Last Name, Gender, Email, Age, Marital Status, Occupation
  - Fields: Reason for Consultation, Complaints (text area)
  - Progress indicator shows "Step 1: Enter Details" as active
- [ ] Step 2: Match with Doctor - Display available doctors
  - Shows doctor cards with: photo, name, specialty
  - Multiple doctors displayed horizontally
  - Progress indicator shows "Step 2: Match with Doctor" as active
- [ ] Step 3: Checkout - Order summary and payment
  - Shows selected doctor information
  - Calendar for date selection
  - Time selection dropdown
  - Order summary card with: consultation details, time, venue, subtotal (NGN 20,000)
  - Progress indicator shows "Step 3: Checkout" as active
- [ ] Navigation: Back arrow to go to previous step
- [ ] "Next" button to proceed to next step
- [ ] "Proceed to Checkout" button on final step

**Priority:** P0 (Critical)  
**Status:** ⚠️ Needs Work (based on existing docs)  
**Comparison:** Matches US-P-006 but with detailed UI flow

---

#### US-P-IMG-004: Select Doctor from Available List
**As a** patient  
**I want** to select a doctor from a visual list of available doctors  
**So that** I can choose the right healthcare provider

**Acceptance Criteria:**
- [ ] Doctor cards display: professional photo, name, specialty
- [ ] Example doctors shown: Dr Peters (Gastroenterologist), Dr Adetola (Cardiologist), Dr Kemi (Nephrologist)
- [ ] Cards are clickable/selectable
- [ ] Selected doctor is highlighted
- [ ] Can proceed to next step after selection

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** Part of US-P-005 and US-P-006, but UI implementation details are new

---

#### US-P-IMG-005: Select Appointment Date and Time
**As a** patient  
**I want** to select appointment date and time from a calendar interface  
**So that** I can schedule my consultation at a convenient time

**Acceptance Criteria:**
- [ ] Calendar displays current month (e.g., February)
- [ ] Dates are selectable
- [ ] Selected date is highlighted
- [ ] Time selection dropdown shows available times (e.g., "9:00am")
- [ ] Selected doctor's information is displayed above calendar
- [ ] Selected time is pre-filled or selectable

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** Part of US-P-006, but calendar UI details are new

---

#### US-P-IMG-006: View Order Summary Before Checkout
**As a** patient  
**I want** to see an order summary before completing payment  
**So that** I can confirm my booking details

**Acceptance Criteria:**
- [ ] Order summary card displays:
  - "Consultation with Dr [Name]"
  - Time: [selected time]
  - Venue: "Daily Co Video"
  - Subtotal: "NGN 20,000" (prominently displayed)
- [ ] Summary is clearly visible before payment
- [ ] Can go back to edit details if needed

**Priority:** P0 (Critical)  
**Status:** 🟡 In Progress (based on existing docs)  
**Comparison:** Part of US-P-007, but UI details are more specific

---

### Epic: Session Notes & Medical Records

#### US-P-IMG-007: View Session Notes with Tabbed Interface
**As a** patient  
**I want** to view my consultation notes in an organized tabbed interface  
**So that** I can easily navigate different aspects of my consultation

**Acceptance Criteria:**
- [ ] Session notes page shows consultation header:
  - "Consultation with Dr [Name]"
  - Date (e.g., "December 1st, 2025")
  - Consultation type tag (e.g., "Initial Consultation")
  - Time (e.g., "10:27am")
  - "Go back" link with arrow
- [ ] Three tabs available:
  - "Medical history" (active state shown with underline)
  - "Requested Investigations"
  - "Diagnosis and Management"
- [ ] Patient demographics displayed above tabs: Name, Age, Sex, Occupation, Marital Status
- [ ] Active tab content is displayed
- [ ] Tabs are clearly clickable and highlight when active

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-P-013 but with detailed UI structure

---

#### US-P-IMG-008: View Medical History in Session Notes
**As a** patient  
**I want** to view the medical history section of my consultation notes  
**So that** I can review what was documented during my appointment

**Acceptance Criteria:**
- [ ] Medical history tab displays form fields:
  - Presenting Complaint
  - History of Presenting Complaint
  - Past Medical & Surgical History
  - Family History
  - Drug and Social History
  - Any Vital Signs
- [ ] Fields are read-only for patients
- [ ] Fields show entered information or are empty if not filled
- [ ] Layout is clear and organized

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Part of US-P-013, but field details are more specific

---

#### US-P-IMG-009: View Requested Investigations in Session Notes
**As a** patient  
**I want** to view investigations requested during my consultation  
**So that** I know what tests were ordered

**Acceptance Criteria:**
- [ ] Requested Investigations tab displays:
  - Section title "Requested Investigations"
  - List of investigations (e.g., "FBC" - Full Blood Count)
  - Each investigation is clearly listed
- [ ] Tab is clickable and shows content when active

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Part of US-P-013 and US-P-015

---

#### US-P-IMG-010: View Diagnosis and Management in Session Notes
**As a** patient  
**I want** to view the diagnosis and management plan from my consultation  
**So that** I understand my treatment plan

**Acceptance Criteria:**
- [ ] Diagnosis and Management tab displays:
  - Diagnosis field (e.g., "Chronic back pain")
  - Management Plan field
  - Drug Prescription field
- [ ] Fields are read-only for patients
- [ ] Information is clearly displayed in two-column layout
- [ ] Tab is clickable and shows content when active

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Part of US-P-013, but specific field layout is new

---

### Epic: Investigations

#### US-P-IMG-011: View Investigations History
**As a** patient  
**I want** to view my investigation history  
**So that** I can see all past lab tests and results

**Acceptance Criteria:**
- [ ] Investigations History section displays:
  - Section title with calendar icon
  - Patient demographics: Name, Age, Sex, Occupation, Marital Status
  - Investigation cards arranged horizontally
  - Each card shows: investigation icon, test name (e.g., "Full Blood Count"), requesting doctor (e.g., "Dr Adeyemi")
- [ ] Cards are visually distinct and organized

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-P-015, but UI layout details are more specific

---

#### US-P-IMG-012: View Pending Investigation Requests
**As a** patient  
**I want** to view pending investigation requests  
**So that** I know what tests I need to complete

**Acceptance Criteria:**
- [ ] Pending Requests section displays:
  - Section title "Pending Requests"
  - Investigation cards similar to history
  - Each card shows: investigation icon, test name, requesting doctor
  - "Upload" button/icon on each pending request card
- [ ] Upload functionality allows adding results

**Priority:** P1 (High)  
**Status:** ✅ Complete (View only, Upload needed)  
**Comparison:** Part of US-P-015, but upload functionality is new requirement

---

#### US-P-IMG-013: Upload Investigation Results
**As a** patient  
**I want** to upload investigation results for pending requests  
**So that** my doctor can review the test results

**Acceptance Criteria:**
- [ ] Upload button/icon is visible on pending investigation cards
- [ ] Clicking upload opens file upload dialog
- [ ] Can upload PDF, images, or documents
- [ ] Upload progress is shown
- [ ] Success confirmation after upload
- [ ] Investigation status changes from "pending" to "completed" after upload

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** NEW - Not explicitly in existing USER_STORIES.md

---

### Epic: Profile Management

#### US-P-IMG-014: View and Edit Profile with Photo Upload
**As a** patient  
**I want** to view and edit my profile with the ability to upload a profile photo  
**So that** my profile is complete and personalized

**Acceptance Criteria:**
- [ ] Profile page displays large circular profile picture
- [ ] Camera icon overlay on profile picture indicates ability to change photo
- [ ] "Upload Profile Photo" button next to profile picture
- [ ] Form fields displayed in two columns:
  - First Name, Last Name, Email Address
  - Gender (dropdown), Marital Status (dropdown), Occupation (dropdown)
- [ ] All fields are editable
- [ ] "Save Changes" button at bottom right
- [ ] Changes are saved and reflected immediately

**Priority:** P1 (High)  
**Status:** 🟡 In Progress (based on existing docs)  
**Comparison:** Matches US-P-004, but photo upload is additional detail

---

### Epic: Settings & Preferences

#### US-P-IMG-015: Access Settings & Preferences
**As a** patient  
**I want** to access settings and preferences  
**So that** I can manage my account and notification preferences

**Acceptance Criteria:**
- [ ] Settings & Preferences page has sub-navigation:
  - "Notifications" tab
  - "Account" tab
- [ ] Active tab is highlighted (green/teal)
- [ ] Can switch between tabs
- [ ] Each tab shows relevant settings

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** NEW - Not explicitly in existing USER_STORIES.md

---

#### US-P-IMG-016: Manage Notification Preferences
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
- [ ] Changes are saved automatically or with save button
- [ ] Current state is reflected (On = green, Off = gray)

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** NEW - Not explicitly in existing USER_STORIES.md

---

#### US-P-IMG-017: Manage Account Settings
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
    - Description text (though shown as "Toggle On to allow SMS notifications" - appears to be UI error)
  - "Danger Zone" section with:
    - "Danger Zone" heading
    - "Delete Account" option with:
      - Red square icon (trash can)
      - Text "Delete Account"
      - Description text
- [ ] Sign out functionality works
- [ ] Delete account requires confirmation
- [ ] Account actions are clearly separated

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** NEW - Not explicitly in existing USER_STORIES.md

---

### Epic: Appointments View

#### US-P-IMG-018: View Upcoming Appointments Page
**As a** patient  
**I want** to view my upcoming appointments on a dedicated page  
**So that** I can see all scheduled consultations

**Acceptance Criteria:**
- [ ] Appointments page shows:
  - Title "Upcoming Appointments" with calendar icon
  - Patient demographics: Name, Age, Sex, Occupation, Marital Status
  - List of appointments (or empty state if none)
- [ ] Page is accessible from navigation
- [ ] Appointments are displayed clearly

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-P-008

---

## Doctor User Stories from Images

### Epic: Doctor Dashboard

#### US-D-IMG-001: View Doctor Dashboard with Metrics
**As a** doctor  
**I want** to view my dashboard with practice metrics  
**So that** I can quickly assess my practice activity

**Acceptance Criteria:**
- [ ] Dashboard displays three summary cards:
  - Total Consultations (with count, e.g., "06")
  - Upcoming Appointments (with count, e.g., "32")
  - Investigations (with count, e.g., "02")
- [ ] Upcoming Appointments section shows appointment cards
- [ ] Each appointment card shows: doctor name, time range, description
- [ ] Cards have action buttons (circular arrow icon)

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-D-016, but UI details are more specific

---

### Epic: Client & Session Management

#### US-D-IMG-002: View Clients and Session Notes List
**As a** doctor  
**I want** to view a list of all my clients with their session notes  
**So that** I can manage patient consultations

**Acceptance Criteria:**
- [ ] "Clients and Session Notes" page displays:
  - Title "Clients and Session Notes"
  - Search bar with magnifying glass icon and "Search" placeholder
  - List of client cards showing:
    - Client name, age, gender (e.g., "Odeyemi Makinde 69yrs M")
    - Action button: "View Session Details" or "Upload Session Notes"
- [ ] Clients are listed in cards
- [ ] Search functionality works
- [ ] Can click to view or upload session notes

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-D-012, but UI details are more specific

---

#### US-D-IMG-003: View Client Details with Sessions
**As a** doctor  
**I want** to view detailed information about a specific client  
**So that** I can see their consultation history

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
- [ ] Sessions tab shows all consultations with this client
- [ ] Can click to view individual session notes
- [ ] Requested Investigations tab shows investigation history

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-D-013, but UI structure is more detailed

---

#### US-D-IMG-004: View and Edit Session Notes
**As a** doctor  
**I want** to view and edit session notes for a consultation  
**So that** I can document patient encounters

**Acceptance Criteria:**
- [ ] Session notes page shows:
  - Consultation header: "Consultation with Dr [Name]", date, consultation type tag, time
  - "Go back" link with arrow
  - Three tabs: "Medical history", "Requested Investigations", "Diagnosis and Management"
  - Patient demographics displayed
- [ ] Medical history tab shows editable form fields:
  - Presenting Complaint
  - History of Presenting Complaint
  - Past Medical & Surgical History
  - Family History
  - Drug and Social History
  - Any Vital Signs
- [ ] Requested Investigations tab shows investigations list
- [ ] Diagnosis and Management tab shows:
  - Diagnosis field (e.g., "Chronic back pain")
  - Management Plan field
  - Drug Prescription field
- [ ] "Save Changes" button at bottom right
- [ ] All fields are editable
- [ ] Changes are saved successfully

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Matches US-D-008, but UI field details are more specific

---

#### US-D-IMG-005: Upload Session Notes
**As a** doctor  
**I want** to upload session notes for a consultation  
**So that** I can add documentation after the consultation

**Acceptance Criteria:**
- [ ] "Upload Session Notes" button is available on client cards
- [ ] Clicking button opens upload interface
- [ ] Can upload document files
- [ ] Upload is linked to specific consultation
- [ ] Success confirmation after upload

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** NEW - Not explicitly in existing USER_STORIES.md

---

### Epic: Investigations Management

#### US-D-IMG-006: View Investigations History
**As a** doctor  
**I want** to view investigations history  
**So that** I can see all requested and completed investigations

**Acceptance Criteria:**
- [ ] Investigations page shows:
  - Title "Investigations History" with calendar icon
  - Investigation cards arranged horizontally
  - Each card shows: investigation icon, test name (e.g., "Full Blood Count"), requesting doctor
- [ ] Cards are organized and visually clear

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Related to US-D-010 and US-D-011, but viewing UI is new

---

#### US-D-IMG-007: View Pending Investigation Requests
**As a** doctor  
**I want** to view pending investigation requests  
**So that** I can track which tests are awaiting results

**Acceptance Criteria:**
- [ ] Pending Requests section displays:
  - Title "Pending Requests"
  - Investigation cards showing pending tests
  - Each card shows: investigation icon, test name, requesting doctor
- [ ] Pending requests are clearly distinguished from completed ones

**Priority:** P1 (High)  
**Status:** ✅ Complete (based on images)  
**Comparison:** Related to US-D-010 and US-D-011

---

### Epic: Doctor Profile

#### US-D-IMG-008: View and Edit Doctor Profile with Photo Upload
**As a** doctor  
**I want** to view and edit my profile with the ability to upload a profile photo  
**So that** my professional profile is complete

**Acceptance Criteria:**
- [ ] Profile page displays:
  - Large circular profile picture
  - Camera icon overlay indicating ability to change photo
  - "Upload Profile Photo" button
  - Form fields in grid layout:
    - First Name, Last Name, Gender, Email Address
    - Marital Status, License Type, Specialty
  - Professional Summary text area
  - "Save Changes" button
- [ ] All fields are editable
- [ ] Photo upload works
- [ ] Changes are saved successfully

**Priority:** P1 (High)  
**Status:** 🟡 In Progress (based on existing docs)  
**Comparison:** Matches US-D-003, but photo upload is additional detail

---

### Epic: Doctor Settings

#### US-D-IMG-009: Manage Doctor Notification Preferences
**As a** doctor  
**I want** to manage my notification preferences  
**So that** I control how I receive updates

**Acceptance Criteria:**
- [ ] Settings & Preferences page with "Notifications" tab
- [ ] "Allow SMS Notifications" toggle with bell icon
- [ ] "Allow Email Notifications" toggle with envelope icon
- [ ] Toggles are functional and save preferences
- [ ] Current state is visually indicated (On = green)

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** Related to US-D-017, but UI implementation is new

---

#### US-D-IMG-010: Manage Doctor Account Settings
**As a** doctor  
**I want** to manage my account settings  
**So that** I can control my account

**Acceptance Criteria:**
- [ ] Account tab in Settings & Preferences
- [ ] "Sign Out of Account" option with red icon
- [ ] "Danger Zone" section with "Delete Account" option
- [ ] Sign out functionality works
- [ ] Delete account requires confirmation

**Priority:** P1 (High)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** NEW - Not explicitly in existing USER_STORIES.md

---

### Epic: Doctor Enrollment

#### US-D-IMG-011: Complete Doctor Enrollment Form
**As a** doctor  
**I want** to complete an enrollment form to join the platform  
**So that** I can become a verified healthcare provider

**Acceptance Criteria:**
- [ ] Enrollment form displays:
  - Title "Doctor's Enrollment"
  - Subtitle "Made Simple & Secure"
  - Description paragraph
  - Form fields in three columns:
    - Row 1: First Name, Last Name, Gender
    - Row 2: Email Address, Age, License Type
    - Row 3: Specialty
  - Professional Summary text area
  - Agreement checkbox: "I hereby agree to the Terms of Service and Privacy Policy"
  - "Complete" button
- [ ] All fields are required and validated
- [ ] Terms and Privacy Policy links are clickable
- [ ] Form submission creates doctor profile
- [ ] License verification workflow is initiated

**Priority:** P0 (Critical)  
**Status:** ❌ Not Started (based on existing docs)  
**Comparison:** Related to US-D-002, but enrollment form UI is more detailed

---

## Landing Page Features

### Epic: Public Landing Page

#### US-LP-IMG-001: View Landing Page
**As a** visitor  
**I want** to view the Care Haven landing page  
**So that** I can learn about the platform and sign up

**Acceptance Criteria:**
- [ ] Header with:
  - Care Haven logo
  - Navigation: Home, How it Works, FAQs, Support
  - Login link
  - "Get Started >" button
- [ ] Hero section with:
  - Headline: "Medical Consultations Made Simple & Secure"
  - Description paragraph
  - "Book a Consultation >" button
  - "Are you a healthcare provider? Join our platform→" link
- [ ] "How It Works" section with:
  - Lock icon and "Secure and Confidential" text
  - Title "How It Works"
  - Three steps with checkmark icons:
    - Step 1: Create Your Account
    - Step 2: Book a Video Consultation
    - Step 3: Manage Your Health in One Place
  - Dashboard mockup image
- [ ] "Frequently asked questions" section with:
  - Lock icon and "Secure and Confidential" text
  - Title "Frequently asked questions"
  - Introduction paragraph
  - FAQ accordion items (expandable/collapsible)
- [ ] Footer with:
  - Care Haven logo
  - Social media icons (Instagram, LinkedIn, X/Twitter, YouTube)
  - Copyright notice
  - Navigation links: How It Works, Privacy Policy, Terms of Service, Support, FAQs
  - Language selector: "English(US)"

**Priority:** P0 (Critical)  
**Status:** ✅ Complete (based on images)  
**Comparison:** NEW - Not in existing USER_STORIES.md

---

## Comparison with Existing USER_STORIES.md

### Stories That Match (with UI Enhancements)

1. **US-P-019** ↔ **US-P-IMG-001**: Dashboard overview - Images show more specific UI layout
2. **US-P-008** ↔ **US-P-IMG-018**: View appointments - Matches well
3. **US-P-006** ↔ **US-P-IMG-003**: Book appointment - Images show detailed multi-step flow
4. **US-P-013** ↔ **US-P-IMG-007**: View session notes - Images show tabbed interface details
5. **US-P-015** ↔ **US-P-IMG-011**: View investigations - Matches with UI details
6. **US-P-004** ↔ **US-P-IMG-014**: Update profile - Images show photo upload feature
7. **US-D-016** ↔ **US-D-IMG-001**: Doctor dashboard - Matches with UI details
8. **US-D-012** ↔ **US-D-IMG-002**: View patients - Matches with UI details
9. **US-D-013** ↔ **US-D-IMG-003**: View patient history - Matches with UI details
10. **US-D-008** ↔ **US-D-IMG-004**: Create SOAP notes - Images show detailed form fields
11. **US-D-003** ↔ **US-D-IMG-008**: Update doctor profile - Images show photo upload

### New Stories Identified from Images

1. **US-P-IMG-004**: Select Doctor from Available List (detailed UI)
2. **US-P-IMG-005**: Select Appointment Date and Time (calendar UI)
3. **US-P-IMG-006**: View Order Summary Before Checkout
4. **US-P-IMG-008**: View Medical History in Session Notes (specific fields)
5. **US-P-IMG-009**: View Requested Investigations in Session Notes
6. **US-P-IMG-010**: View Diagnosis and Management in Session Notes
7. **US-P-IMG-012**: View Pending Investigation Requests
8. **US-P-IMG-013**: Upload Investigation Results ⚠️ **NEW**
9. **US-P-IMG-015**: Access Settings & Preferences ⚠️ **NEW**
10. **US-P-IMG-016**: Manage Notification Preferences ⚠️ **NEW**
11. **US-P-IMG-017**: Manage Account Settings ⚠️ **NEW**
12. **US-D-IMG-005**: Upload Session Notes ⚠️ **NEW**
13. **US-D-IMG-006**: View Investigations History (doctor view)
14. **US-D-IMG-007**: View Pending Investigation Requests (doctor view)
15. **US-D-IMG-009**: Manage Doctor Notification Preferences ⚠️ **NEW**
16. **US-D-IMG-010**: Manage Doctor Account Settings ⚠️ **NEW**
17. **US-D-IMG-011**: Complete Doctor Enrollment Form (detailed UI)
18. **US-LP-IMG-001**: View Landing Page ⚠️ **NEW**

---

## Missing User Stories

### Critical Missing Stories (P0)

1. **Upload Investigation Results** (US-P-IMG-013) - Patients need to upload lab results
2. **Settings & Preferences UI** (US-P-IMG-015, US-P-IMG-016, US-P-IMG-017) - Account management
3. **Doctor Settings UI** (US-D-IMG-009, US-D-IMG-010) - Doctor account management
4. **Landing Page** (US-LP-IMG-001) - Public-facing marketing page

### High Priority Missing Stories (P1)

1. **Upload Session Notes** (US-D-IMG-005) - Doctors need to upload notes
2. **Notification Preferences Toggle** (US-P-IMG-016, US-D-IMG-009) - User control over notifications
3. **Account Management** (US-P-IMG-017, US-D-IMG-010) - Sign out and delete account

### UI/UX Enhancements Needed

1. **Multi-step booking flow** - More detailed step indicators and navigation
2. **Calendar date picker** - Visual calendar for appointment scheduling
3. **Doctor selection cards** - Visual doctor cards with photos and specialties
4. **Tabbed session notes interface** - Better organization of consultation data
5. **Order summary card** - Clear checkout confirmation
6. **Profile photo upload** - Both patient and doctor profiles
7. **Settings sub-navigation** - Tabs for Notifications and Account

---

## Additional Features Identified

### UI Components Needed

1. **Calendar Component** - For date selection in appointment booking
2. **Doctor Card Component** - For displaying available doctors
3. **Order Summary Component** - For checkout confirmation
4. **Tabbed Interface Component** - For session notes organization
5. **Toggle Switch Component** - For notification preferences
6. **File Upload Component** - For investigation results and session notes
7. **Progress Indicator Component** - For multi-step forms
8. **Settings Navigation Component** - For settings sub-navigation

### Data Fields Identified

**Session Notes Medical History:**
- Presenting Complaint
- History of Presenting Complaint
- Past Medical & Surgical History
- Family History
- Drug and Social History
- Any Vital Signs

**Session Notes Diagnosis & Management:**
- Diagnosis
- Management Plan
- Drug Prescription

**Doctor Enrollment:**
- First Name, Last Name
- Gender, Age
- Email Address
- License Type (dropdown)
- Specialty (dropdown)
- Professional Summary

**Profile Fields:**
- Profile Photo (upload)
- First Name, Last Name
- Email Address
- Gender, Marital Status, Occupation

---

## Recommendations

### Immediate Actions (P0)

1. **Add missing user stories** to USER_STORIES.md:
   - Upload Investigation Results (US-P-IMG-013)
   - Settings & Preferences (US-P-IMG-015, US-P-IMG-016, US-P-IMG-017)
   - Doctor Settings (US-D-IMG-009, US-D-IMG-010)
   - Landing Page (US-LP-IMG-001)

2. **Update existing stories** with UI details:
   - Add specific field names to session notes stories
   - Add multi-step flow details to booking story
   - Add calendar and time selection to appointment booking

3. **Create UI component backlog**:
   - Calendar date picker
   - Doctor selection cards
   - Order summary card
   - Tabbed interface
   - Toggle switches
   - File upload component

### High Priority Actions (P1)

1. **Implement Settings & Preferences pages** for both patients and doctors
2. **Add file upload functionality** for investigation results and session notes
3. **Enhance booking flow** with calendar and doctor selection UI
4. **Add profile photo upload** to profile pages

### Medium Priority Actions (P2)

1. **Enhance session notes UI** with tabbed interface
2. **Add order summary** to checkout flow
3. **Improve doctor enrollment form** with better UI

---

**Document Status:** Analysis Complete  
**Next Steps:** Update USER_STORIES.md with missing stories and UI details  
**Owner:** Product Team
