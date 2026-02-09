# User Stories Comparison: Existing vs. Extracted from Images

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Compare existing USER_STORIES.md with user stories extracted from UI images

---

## Executive Summary

### Statistics

- **Existing User Stories:** 35 stories (18 Patient, 14 Doctor, 3 Admin)
- **Extracted from Images:** 29 new/detailed stories
- **Missing Critical Stories:** 6 stories
- **UI Enhancement Details:** 15+ stories need UI details added

### Key Findings

1. **✅ Well Documented:** Core booking, consultation, and profile features are documented
2. **⚠️ Missing UI Details:** Many stories lack specific UI/UX implementation details
3. **❌ Missing Features:** Settings & Preferences, File Uploads, Landing Page not documented
4. **🔄 Needs Update:** Several stories need UI field details and flow enhancements

---

## Detailed Comparison

### Patient Stories Comparison

| Existing Story | Image Story | Status | Notes |
|---------------|-------------|--------|-------|
| US-P-001: Sign In with Google | - | ✅ Complete | Matches implementation |
| US-P-002: Complete Profile | - | ✅ Complete | Matches implementation |
| US-P-003: View My Profile | - | ✅ Complete | Matches implementation |
| US-P-004: Update My Profile | US-P-IMG-014 | 🟡 Needs UI Details | **Add:** Photo upload feature |
| US-P-005: Browse Available Doctors | US-P-IMG-004 | ⚠️ Needs UI Details | **Add:** Doctor card layout, photos, specialties |
| US-P-006: Book an Appointment | US-P-IMG-003 | ⚠️ Needs UI Details | **Add:** Multi-step flow, progress indicators |
| US-P-006: Book an Appointment | US-P-IMG-005 | ⚠️ Missing | **Add:** Calendar date picker, time selection |
| US-P-006: Book an Appointment | US-P-IMG-006 | ⚠️ Missing | **Add:** Order summary before checkout |
| US-P-007: Pay for Appointment | - | 🟡 In Progress | Matches, needs callback route |
| US-P-008: View My Appointments | US-P-IMG-018 | ✅ Complete | Matches UI |
| US-P-009: Reschedule Appointment | - | ❌ Not Started | No UI shown in images |
| US-P-010: Cancel Appointment | - | ❌ Not Started | No UI shown in images |
| US-P-011: Join Video Consultation | - | 🟡 In Progress | Matches implementation |
| US-P-012: End Video Consultation | - | ❌ Not Started | No UI shown in images |
| US-P-013: View Consultation Notes | US-P-IMG-007 | ⚠️ Needs UI Details | **Add:** Tabbed interface structure |
| US-P-013: View Consultation Notes | US-P-IMG-008 | ⚠️ Missing | **Add:** Medical history field details |
| US-P-013: View Consultation Notes | US-P-IMG-009 | ⚠️ Missing | **Add:** Requested investigations in notes |
| US-P-013: View Consultation Notes | US-P-IMG-010 | ⚠️ Missing | **Add:** Diagnosis & management layout |
| US-P-014: View Prescriptions | - | ❌ Not Started | No UI shown in images |
| US-P-015: View Investigation Results | US-P-IMG-011 | ✅ Complete | Matches UI |
| US-P-015: View Investigation Results | US-P-IMG-012 | ⚠️ Missing | **Add:** Pending requests section |
| US-P-015: View Investigation Results | US-P-IMG-013 | ❌ **NEW STORY** | **Add:** Upload investigation results |
| US-P-016: Receive Notifications | - | 🟡 In Progress | Backend exists, UI missing |
| US-P-017: Message Doctor | - | ❌ Not Started | No UI shown in images |
| US-P-018: View Notifications | - | ❌ Not Started | No UI shown in images |
| US-P-019: View Dashboard Overview | US-P-IMG-001 | ✅ Complete | Matches UI |
| US-P-019: View Dashboard Overview | US-P-IMG-002 | ✅ Complete | Matches UI |
| - | US-P-IMG-015 | ❌ **NEW STORY** | **Add:** Settings & Preferences access |
| - | US-P-IMG-016 | ❌ **NEW STORY** | **Add:** Notification preferences toggle |
| - | US-P-IMG-017 | ❌ **NEW STORY** | **Add:** Account settings (sign out, delete) |

### Doctor Stories Comparison

| Existing Story | Image Story | Status | Notes |
|---------------|-------------|--------|-------|
| US-D-001: Sign In with Google | - | ✅ Complete | Matches implementation |
| US-D-002: Complete Doctor Profile | US-D-IMG-011 | ⚠️ Needs UI Details | **Add:** Enrollment form layout |
| US-D-003: Update Doctor Profile | US-D-IMG-008 | 🟡 Needs UI Details | **Add:** Photo upload feature |
| US-D-004: View My Appointments | - | ✅ Complete | Matches implementation |
| US-D-005: View Appointment Details | - | 🟡 In Progress | Needs UI implementation |
| US-D-006: Join Video Consultation | - | 🟡 In Progress | Matches implementation |
| US-D-007: Update Appointment Status | - | 🟡 In Progress | Backend exists |
| US-D-008: Create SOAP Notes | US-D-IMG-004 | ⚠️ Needs UI Details | **Add:** Specific field names and layout |
| US-D-009: Create Prescription | - | ❌ Not Started | No UI shown in images |
| US-D-010: Request Lab Investigation | - | ❌ Not Started | No UI shown in images |
| US-D-011: Review Investigation Results | - | ❌ Not Started | No UI shown in images |
| US-D-012: View My Patients | US-D-IMG-002 | ✅ Complete | Matches UI |
| US-D-013: View Patient Medical History | US-D-IMG-003 | ✅ Complete | Matches UI |
| US-D-014: Set My Availability | - | ❌ Not Started | No UI shown in images |
| US-D-015: View My Schedule | - | ❌ Not Started | No UI shown in images |
| US-D-016: View Dashboard Metrics | US-D-IMG-001 | ✅ Complete | Matches UI |
| US-D-017: Receive Notifications | - | 🟡 In Progress | Backend exists, UI missing |
| US-D-018: Message Patients | - | ❌ Not Started | No UI shown in images |
| - | US-D-IMG-005 | ❌ **NEW STORY** | **Add:** Upload session notes |
| - | US-D-IMG-006 | ⚠️ Missing | **Add:** View investigations history (doctor) |
| - | US-D-IMG-007 | ⚠️ Missing | **Add:** View pending requests (doctor) |
| - | US-D-IMG-009 | ❌ **NEW STORY** | **Add:** Doctor notification preferences |
| - | US-D-IMG-010 | ❌ **NEW STORY** | **Add:** Doctor account settings |

### Landing Page & Public Features

| Feature | Image Story | Status | Notes |
|---------|-------------|--------|-------|
| Landing Page | US-LP-IMG-001 | ❌ **NEW STORY** | **Add:** Complete landing page with hero, how it works, FAQs, footer |

---

## Critical Missing Stories (Must Add)

### 1. Upload Investigation Results (US-P-IMG-013)
**Priority:** P0 (Critical)  
**Why:** Patients need to upload lab results for doctor review  
**Status:** ❌ Not in existing USER_STORIES.md

### 2. Settings & Preferences - Patient (US-P-IMG-015, US-P-IMG-016, US-P-IMG-017)
**Priority:** P0 (Critical)  
**Why:** Essential account management features  
**Status:** ❌ Not in existing USER_STORIES.md

### 3. Settings & Preferences - Doctor (US-D-IMG-009, US-D-IMG-010)
**Priority:** P0 (Critical)  
**Why:** Essential account management for doctors  
**Status:** ❌ Not in existing USER_STORIES.md

### 4. Landing Page (US-LP-IMG-001)
**Priority:** P0 (Critical)  
**Why:** Public-facing marketing page for user acquisition  
**Status:** ❌ Not in existing USER_STORIES.md

### 5. Upload Session Notes (US-D-IMG-005)
**Priority:** P1 (High)  
**Why:** Doctors need to upload notes after consultations  
**Status:** ❌ Not in existing USER_STORIES.md

---

## Stories Needing UI Details Enhancement

### High Priority UI Details Needed

1. **US-P-006: Book an Appointment**
   - Add: Multi-step progress indicators
   - Add: Calendar date picker UI
   - Add: Time selection dropdown
   - Add: Order summary card before checkout

2. **US-P-005: Browse Available Doctors**
   - Add: Doctor card layout with photos
   - Add: Specialty display
   - Add: Visual selection state

3. **US-P-013: View Consultation Notes**
   - Add: Tabbed interface structure
   - Add: Specific field names (Presenting Complaint, etc.)
   - Add: Two-column layout for diagnosis & management

4. **US-D-008: Create SOAP Notes**
   - Add: Specific medical history fields
   - Add: Diagnosis & management field layout
   - Add: Save changes button placement

5. **US-P-004 & US-D-003: Update Profile**
   - Add: Profile photo upload feature
   - Add: Camera icon overlay
   - Add: Upload button placement

---

## Recommended Action Plan

### Phase 1: Add Missing Critical Stories (Week 1)

1. **Add to USER_STORIES.md:**
   - US-P-IMG-013: Upload Investigation Results
   - US-P-IMG-015: Access Settings & Preferences
   - US-P-IMG-016: Manage Notification Preferences
   - US-P-IMG-017: Manage Account Settings
   - US-D-IMG-009: Manage Doctor Notification Preferences
   - US-D-IMG-010: Manage Doctor Account Settings
   - US-LP-IMG-001: View Landing Page

2. **Update existing stories with UI details:**
   - US-P-006: Add multi-step flow details
   - US-P-005: Add doctor card UI details
   - US-P-013: Add tabbed interface and field details
   - US-D-008: Add form field details

### Phase 2: Enhance UI Documentation (Week 2)

1. **Add UI component requirements:**
   - Calendar date picker
   - Doctor selection cards
   - Order summary card
   - Tabbed interface
   - Toggle switches
   - File upload component

2. **Add field-level details:**
   - Medical history fields
   - Diagnosis & management fields
   - Profile form fields
   - Enrollment form fields

### Phase 3: Implementation Priority (Week 3+)

1. **P0 Implementation:**
   - Settings & Preferences pages
   - Upload investigation results
   - Landing page

2. **P1 Implementation:**
   - Upload session notes
   - Enhanced booking flow with calendar
   - Profile photo upload

---

## Summary Table

| Category | Count | Status |
|----------|-------|--------|
| **Existing Stories** | 35 | Documented |
| **New Stories from Images** | 7 | ❌ Missing |
| **Stories Needing UI Details** | 8 | ⚠️ Needs Enhancement |
| **UI Components Identified** | 8 | Needs Documentation |
| **Data Fields Identified** | 20+ | Needs Documentation |

---

## Next Steps

1. ✅ **Extraction Complete** - User stories extracted from images
2. ⏳ **Comparison Complete** - Compared with existing documentation
3. 📝 **Update USER_STORIES.md** - Add missing stories and UI details
4. 🎨 **Create UI Component Specs** - Document required components
5. 🚀 **Prioritize Implementation** - Focus on P0 missing stories

---

**Document Status:** Analysis Complete  
**Action Required:** Update USER_STORIES.md with missing stories  
**Owner:** Product Team  
**Review Date:** After USER_STORIES.md update
