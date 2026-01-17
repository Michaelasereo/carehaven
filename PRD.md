# Care Haven - Product Requirements Document (PRD)

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Product:** Telemedicine Platform  
**Status:** Active Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Personas](#user-personas)
4. [Product Goals & Objectives](#product-goals--objectives)
5. [Functional Requirements](#functional-requirements)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [User Flows](#user-flows)
8. [Technical Architecture](#technical-architecture)
9. [Data Models](#data-models)
10. [API Specifications](#api-specifications)
11. [Integration Requirements](#integration-requirements)
12. [Security & Compliance](#security--compliance)
13. [Success Metrics](#success-metrics)
14. [Future Roadmap](#future-roadmap)

---

## Executive Summary

**Care Haven** is a comprehensive telemedicine platform designed to connect patients with licensed healthcare professionals through secure, HIPAA-compliant video consultations. The platform enables end-to-end healthcare delivery including appointment scheduling, virtual consultations, electronic prescriptions, lab investigation requests, and secure messaging.

**Key Value Propositions:**
- **For Patients:** Convenient, secure access to healthcare professionals from anywhere
- **For Doctors:** Streamlined telemedicine practice management with integrated patient records
- **For Healthcare:** Improved access to care with reduced barriers (geography, time, cost)

**Current Status:** MVP phase with core features implemented. Active development on enhancements and optimization.

---

## Product Overview

### Product Vision
To revolutionize healthcare access in Nigeria and beyond by providing a secure, user-friendly platform that makes quality medical consultations accessible to everyone, anytime, anywhere.

### Product Mission
Empower healthcare delivery through technology by connecting patients with trusted healthcare professionals via secure, compliant telemedicine infrastructure.

### Key Features
1. **Secure Authentication** - Google OAuth integration
2. **Appointment Management** - Multi-step booking with payment integration
3. **Video Consultations** - HIPAA-compliant video calls via Daily.co
4. **Medical Records** - SOAP notes, prescriptions, investigations
5. **Secure Messaging** - Real-time communication between patients and doctors
6. **Payment Processing** - Integrated Paystack payment gateway
7. **Notifications** - Multi-channel (Email, SMS, In-app) notifications

### Target Market
- **Primary:** Urban and peri-urban populations in Nigeria seeking convenient healthcare access
- **Secondary:** Rural populations with internet access
- **Tertiary:** International expansion potential

---

## User Personas

### Persona 1: Patient - "Busy Professional"
- **Name:** Chidi Okonkwo
- **Age:** 35
- **Occupation:** Software Engineer
- **Location:** Lagos, Nigeria
- **Goals:**
  - Get medical consultations without taking time off work
  - Access quality healthcare quickly
  - Maintain medical records in one place
- **Pain Points:**
  - Long wait times at clinics
  - Difficulty scheduling appointments during work hours
  - Lost medical records

### Persona 2: Patient - "Rural Resident"
- **Name:** Fatima Abdullahi
- **Age:** 42
- **Occupation:** Teacher
- **Location:** Kano, Nigeria
- **Goals:**
  - Access specialist care without traveling far
  - Affordable healthcare options
  - Continuity of care
- **Pain Points:**
  - Limited access to specialists
  - High travel costs
  - Language barriers

### Persona 3: Doctor - "Telemedicine Provider"
- **Name:** Dr. Adebayo Okafor
- **Age:** 38
- **Specialty:** General Practice
- **Location:** Abuja, Nigeria
- **Goals:**
  - Expand patient reach
  - Efficient practice management
  - Secure patient data handling
- **Pain Points:**
  - Managing multiple communication channels
  - Ensuring HIPAA compliance
  - Scheduling efficiency

---

## Product Goals & Objectives

### Primary Goals
1. **User Acquisition:** Reach 10,000 registered patients and 500 doctors in first year
2. **Platform Reliability:** Maintain 99.9% uptime
3. **Security Compliance:** Achieve and maintain HIPAA compliance
4. **User Satisfaction:** Achieve 4.5+ star rating from users

### Key Objectives (Q1 2025)
- Complete profile completion flow refinements
- Implement appointment rescheduling
- Add prescription refill workflow
- Enhance notification system
- Improve video call quality and reliability

### Success Criteria
- **Technical:** <2s page load time, <100ms API response time
- **Business:** 1000+ appointments per month, 80% payment completion rate
- **User Experience:** <3 clicks to book appointment, <30s to join video call

---

## Functional Requirements

### FR-1: Authentication & Authorization

#### FR-1.1: Google OAuth Integration
- **Priority:** P0 (Critical)
- **Description:** Users can sign in using Google OAuth
- **Requirements:**
  - Google OAuth button on sign-in page
  - OAuth callback handling
  - Automatic profile creation from Google data
  - Session management
  - Secure token storage
- **Dependencies:** Google OAuth API, Supabase Auth

#### FR-1.2: Profile Completion
- **Priority:** P0
- **Description:** Users must complete profile before accessing platform
- **Requirements:**
  - Profile completion check middleware
  - Redirect to completion page if incomplete
  - Required fields validation
  - Role-based profile fields (patient vs doctor)
- **Dependencies:** Profile schema, Validation logic

#### FR-1.3: Role-Based Access Control
- **Priority:** P0
- **Description:** Different access levels for patients, doctors, admins
- **Requirements:**
  - Role stored in profile
  - Route protection based on role
  - UI adaptation based on role
- **Dependencies:** Profile schema, Middleware

---

### FR-2: Patient Features

#### FR-2.1: Appointment Booking
- **Priority:** P0
- **Description:** Multi-step appointment booking process
- **Requirements:**
  - Step 1: Enter consultation details (reason, symptoms)
  - Step 2: Select doctor from available list
  - Step 3: Select date/time, review and checkout
  - Validation at each step
  - Progress indicator
- **Dependencies:** Doctor availability, Calendar, Payment system

#### FR-2.2: Payment Processing
- **Priority:** P0
- **Description:** Secure payment for appointments
- **Requirements:**
  - Paystack integration
  - Payment initialization
  - Payment verification
  - Status tracking (pending, paid, failed, refunded)
  - Retry mechanism for failed payments
- **Dependencies:** Paystack API, Appointment creation

#### FR-2.3: Video Consultation
- **Priority:** P0
- **Description:** Join video calls with doctors
- **Requirements:**
  - Daily.co room creation
  - Secure token generation
  - Video interface with controls
  - Appointment status updates
- **Dependencies:** Daily.co API, Appointment system

#### FR-2.4: View Medical Records
- **Priority:** P1 (High)
- **Description:** Access consultation notes, prescriptions, investigations
- **Requirements:**
  - SOAP notes view (read-only)
  - Prescriptions list with details
  - Investigations list with results
  - Historical records access
- **Dependencies:** Consultation notes, Prescriptions, Investigations tables

---

### FR-3: Doctor Features

#### FR-3.1: Appointment Management
- **Priority:** P0
- **Description:** View and manage appointments
- **Requirements:**
  - View all appointments (upcoming, past)
  - Update appointment status
  - Filter by status, date
  - Patient information display
- **Dependencies:** Appointments table, Patient profiles

#### FR-3.2: Video Consultation
- **Priority:** P0
- **Description:** Conduct video consultations
- **Requirements:**
  - Join scheduled appointments
  - Video interface access
  - Update appointment status during call
  - End call and update to completed
- **Dependencies:** Daily.co, Appointments

#### FR-3.3: SOAP Notes Creation
- **Priority:** P1
- **Description:** Create consultation notes in SOAP format
- **Requirements:**
  - SOAP form: Subjective, Objective, Assessment, Plan
  - Additional: Diagnosis, Management Plan, Prescriptions
  - Save/update notes
  - Link to appointment
- **Dependencies:** Consultation notes table, Appointments

#### FR-3.4: Prescription Management
- **Priority:** P1
- **Description:** Create and manage prescriptions
- **Requirements:**
  - Create prescriptions (medications JSONB, instructions, duration, refills)
  - Status tracking
  - Link to appointment and patient
  - Notification to patient
- **Dependencies:** Prescriptions table, Notifications

#### FR-3.5: Investigation Requests
- **Priority:** P1
- **Description:** Request lab investigations
- **Requirements:**
  - Create investigation requests
  - Specify test name and type
  - Status tracking
  - Review results when uploaded
  - Add interpretation
- **Dependencies:** Investigations table, File upload

#### FR-3.6: Patient Management
- **Priority:** P1
- **Description:** View and manage patient information
- **Requirements:**
  - Patient list (all patients with appointments)
  - Patient profile view
  - Medical history (appointments, notes, prescriptions, investigations)
  - Search and filter patients
- **Dependencies:** Profiles, Appointments, Medical records

---

### FR-4: Communication

#### FR-4.1: Real-Time Messaging
- **Priority:** P1
- **Description:** Secure messaging between patients and doctors
- **Requirements:**
  - Message interface
  - Real-time delivery (Supabase Realtime)
  - Read receipts
  - Message history
  - Link messages to appointments (optional)
- **Dependencies:** Messages table, Supabase Realtime

#### FR-4.2: Notifications System
- **Priority:** P1
- **Description:** Multi-channel notifications
- **Requirements:**
  - In-app notifications (bell icon, unread count)
  - Email notifications (Brevo)
  - SMS notifications (Twilio)
  - Notification types: appointment, prescription, investigation, message, system
  - Mark as read functionality
- **Dependencies:** Notifications table, Email service, SMS service

---

### FR-5: Admin Features (Future)

#### FR-5.1: Doctor Verification
- **Priority:** P2 (Medium)
- **Description:** Verify doctor licenses
- **Status:** Planned
- **Requirements:**
  - License verification workflow
  - Status update (pending, verified, rejected)
  - Notification to doctor

#### FR-5.2: Platform Analytics
- **Priority:** P2
- **Description:** Dashboard with platform metrics
- **Status:** Planned
- **Requirements:**
  - User counts (patients, doctors)
  - Appointment statistics
  - Revenue metrics
  - System health monitoring

---

## Non-Functional Requirements

### NFR-1: Performance
- **Page Load Time:** <2 seconds for 95th percentile
- **API Response Time:** <100ms for 95th percentile
- **Video Call Latency:** <150ms
- **Database Query Time:** <50ms for standard queries
- **Concurrent Users:** Support 1000+ concurrent users

### NFR-2: Security
- **Authentication:** OAuth 2.0 / JWT tokens
- **Data Encryption:** TLS 1.3 for data in transit, AES-256 for data at rest
- **Compliance:** HIPAA compliance for video calls and data storage
- **Access Control:** Row-Level Security (RLS) on all tables
- **Payment Security:** PCI-DSS compliant payment processing (via Paystack)

### NFR-3: Reliability & Availability
- **Uptime:** 99.9% availability (8.76 hours downtime/year)
- **Error Rate:** <0.1% for critical operations
- **Backup:** Daily automated backups
- **Disaster Recovery:** RPO <1 hour, RTO <4 hours

### NFR-4: Scalability
- **User Growth:** Support 100x user growth without major refactoring
- **Database:** Horizontal scaling capability
- **Video Calls:** Support concurrent video calls
- **Storage:** Scalable file storage for investigation results

### NFR-5: Usability
- **Mobile Responsive:** Full functionality on mobile devices
- **Accessibility:** WCAG 2.1 AA compliance
- **Internationalization:** English (initial), multi-language support (future)
- **User Experience:** <3 clicks to complete primary actions

### NFR-6: Maintainability
- **Code Quality:** TypeScript strict mode, ESLint compliance
- **Documentation:** Comprehensive code documentation
- **Testing:** Unit tests for critical paths, E2E tests for user flows
- **Monitoring:** Error tracking (Sentry), performance monitoring

---

## User Flows

### Flow 1: Patient Appointment Booking
```
1. User visits landing page
2. Clicks "Sign in with Google"
3. Completes OAuth flow
4. Redirected to profile completion (if incomplete)
5. Completes profile form
6. Redirected to patient dashboard
7. Clicks "Book Appointment"
8. Step 1: Enters consultation reason and symptoms
9. Step 2: Selects doctor from list
10. Step 3: Selects date/time, reviews summary
11. Clicks "Proceed to Checkout"
12. Payment initialized, redirected to Paystack
13. Completes payment
14. Payment verified, appointment confirmed
15. Receives confirmation notification (Email + SMS)
16. Appointment appears in dashboard
```

### Flow 2: Video Consultation
```
1. Patient/Doctor views upcoming appointment
2. Appointment time arrives
3. Clicks "Join Consultation" button
4. System checks appointment status
5. Creates Daily.co room (if not exists)
6. Generates secure access token
7. Loads video interface with token
8. Both parties join call
9. Appointment status updated to "in_progress"
10. Consultation occurs
11. Either party leaves call
12. Appointment status updated to "completed"
13. Doctor creates SOAP notes
14. Doctor creates prescription (if needed)
15. Patient receives notification
```

### Flow 3: Doctor Consultation Management
```
1. Doctor logs in to dashboard
2. Views upcoming appointments
3. Clicks on appointment to view details
4. At appointment time, clicks "Join Consultation"
5. Joins video call
6. During/after call, clicks "Add Notes"
7. Fills SOAP form (Subjective, Objective, Assessment, Plan)
8. Adds diagnosis and management plan
9. Saves notes
10. Creates prescription (if needed)
11. Requests investigation (if needed)
12. All actions trigger notifications to patient
```

---

## Technical Architecture

### Architecture Overview
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Backend:** Next.js API Routes, Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Video:** Daily.co (HIPAA-compliant)
- **Payments:** Paystack
- **Email:** Brevo (formerly Sendinblue)
- **SMS:** Twilio
- **Deployment:** Netlify
- **Monitoring:** Sentry (error tracking)

### Technology Stack Details

#### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI)
- **Forms:** React Hook Form + Zod validation
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Date Handling:** date-fns

#### Backend
- **API:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage (for investigation results)

#### Integrations
- **Video:** @daily-co/daily-js
- **Payments:** Paystack API
- **Email:** @getbrevo/brevo
- **SMS:** Twilio SDK

### System Architecture Diagram
```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
┌──────▼──────┐                    ┌─────────▼──────┐
│  Supabase   │                    │  External APIs │
│             │                    │                │
│ - Auth      │                    │ - Daily.co     │
│ - Database  │                    │ - Paystack     │
│ - Realtime  │                    │ - Brevo        │
│ - Storage   │                    │ - Twilio       │
└─────────────┘                    └────────────────┘
```

---

## Data Models

### Core Entities

#### Profile
- `id` (UUID, PK) - References auth.users
- `role` (TEXT) - 'patient', 'doctor', 'admin'
- `full_name`, `email`, `avatar_url`
- `profile_completed` (BOOLEAN)
- `date_of_birth`, `gender`, `phone`, `blood_group`
- `allergies` (TEXT[]), `chronic_conditions` (TEXT[])
- `license_number`, `license_verified` (doctors)
- `specialty`, `years_experience`, `consultation_fee`, `bio` (doctors)
- `created_at`, `updated_at`

#### Appointment
- `id` (UUID, PK)
- `patient_id` (UUID, FK → profiles)
- `doctor_id` (UUID, FK → profiles)
- `scheduled_at` (TIMESTAMP)
- `duration_minutes` (INTEGER, default 30)
- `status` (TEXT) - 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
- `chief_complaint`, `symptoms_description`
- `daily_room_name`, `daily_room_url`, `recording_id`, `recording_url`
- `amount`, `currency`, `paystack_reference`
- `payment_status` (TEXT) - 'pending', 'paid', 'failed', 'refunded'
- `created_at`, `updated_at`

#### Consultation Notes
- `id` (UUID, PK)
- `appointment_id` (UUID, FK → appointments)
- `doctor_id` (UUID, FK → profiles)
- `subjective`, `objective`, `assessment`, `plan` (TEXT)
- `diagnosis` (TEXT)
- `prescription` (JSONB)
- `created_at`, `updated_at`

#### Prescription
- `id` (UUID, PK)
- `appointment_id` (UUID, FK → appointments)
- `patient_id`, `doctor_id` (UUID, FK → profiles)
- `medications` (JSONB)
- `instructions`, `duration_days`, `refills_remaining`
- `status` (TEXT) - 'active', 'filled', 'expired', 'cancelled'
- `filled_at`, `expires_at`, `created_at`

#### Investigation
- `id` (UUID, PK)
- `appointment_id` (UUID, FK → appointments)
- `patient_id`, `doctor_id` (UUID, FK → profiles)
- `test_name`, `test_type`
- `status` (TEXT) - 'requested', 'in_progress', 'completed', 'cancelled'
- `requested_at`, `completed_at`
- `results_url`, `results_text`, `interpretation`
- `created_at`, `updated_at`

#### Message
- `id` (UUID, PK)
- `sender_id`, `receiver_id` (UUID, FK → profiles)
- `appointment_id` (UUID, FK → appointments, nullable)
- `content` (TEXT)
- `attachments` (JSONB)
- `read` (BOOLEAN), `read_at`
- `created_at`

#### Notification
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `type` (TEXT) - 'appointment', 'prescription', 'investigation', 'message', 'system'
- `title`, `body`, `data` (JSONB)
- `read` (BOOLEAN), `read_at`
- `created_at`

---

## API Specifications

### Authentication APIs
- `POST /auth/callback` - OAuth callback handler
- `GET /auth/signin` - Sign-in page

### Appointment APIs
- `POST /api/appointments` - Create appointment (internal)
- `GET /api/appointments` - Get appointments (via Supabase client)

### Payment APIs
- `POST /api/payments/initialize` - Initialize Paystack payment
  - Request: `{ amount, appointmentId }`
  - Response: `{ authorization_url }`
- `GET /api/payments/verify` - Verify payment
  - Query: `reference`, `appointmentId`
  - Response: `{ status, appointment }`

### Video APIs
- `POST /api/daily/create-room` - Create Daily.co room
  - Request: `{ appointmentId }`
  - Response: `{ room: { name, url } }`
- `POST /api/daily/get-token` - Get Daily.co access token
  - Request: `{ roomName }`
  - Response: `{ token }`

### Notification APIs
- `POST /api/notifications/send-email` - Send email
  - Request: `{ to, subject, htmlContent }`
- `POST /api/notifications/send-sms` - Send SMS
  - Request: `{ to, message }`

### Data Access
- **Primary:** Direct Supabase client queries (server-side)
- **Real-time:** Supabase Realtime subscriptions (client-side)
- **Caching:** React Query for client-side caching

---

## Integration Requirements

### Daily.co Integration
- **Purpose:** HIPAA-compliant video consultations
- **Requirements:**
  - Room creation API
  - Token generation for secure access
  - Room management (create, get, delete)
  - Optional: Recording capabilities
- **Credentials:** Daily.co API key stored in environment variables

### Paystack Integration
- **Purpose:** Payment processing (Nigerian Naira)
- **Requirements:**
  - Payment initialization
  - Payment verification
  - Webhook handling for payment callbacks
  - Support for refunds (future)
- **Credentials:** Paystack secret key stored securely

### Brevo Integration
- **Purpose:** Email notifications
- **Requirements:**
  - Send transactional emails
  - Email templates for different notification types
  - Delivery tracking
- **Credentials:** Brevo API key

### Twilio Integration
- **Purpose:** SMS notifications
- **Requirements:**
  - Send SMS messages
  - Delivery receipts
  - Cost optimization (batch sending)
- **Credentials:** Twilio Account SID and Auth Token

---

## Security & Compliance

### Security Measures

#### Authentication & Authorization
- OAuth 2.0 for Google sign-in
- JWT tokens managed by Supabase
- Session management with secure cookies
- Role-based access control (RBAC)

#### Data Protection
- Row-Level Security (RLS) on all database tables
- TLS 1.3 encryption for data in transit
- Encryption at rest (Supabase managed)
- Secure environment variable storage

#### Payment Security
- No direct card data storage
- PCI-DSS compliant via Paystack
- Secure payment reference tracking
- Payment verification before appointment confirmation

### HIPAA Compliance
- **Video Calls:** Daily.co HIPAA-compliant infrastructure
- **Data Storage:** Supabase BAA (Business Associate Agreement)
- **Access Controls:** RLS policies ensure data isolation
- **Audit Logging:** Track access to PHI (Protected Health Information)
- **Minimum Necessary:** Users can only access required data

### Privacy
- User consent for data collection
- Clear privacy policy
- Data retention policies
- Right to data deletion

---

## Success Metrics

### User Metrics
- **Active Users:** Daily Active Users (DAU), Monthly Active Users (MAU)
- **User Growth:** New registrations per month
- **Retention:** 30-day, 90-day retention rates
- **Engagement:** Average appointments per user per month

### Business Metrics
- **Appointments:** Total appointments, completed appointments, cancellation rate
- **Revenue:** Total revenue, average transaction value, payment success rate
- **Conversion:** Sign-up to first appointment rate, appointment booking completion rate

### Technical Metrics
- **Performance:** Page load time, API response time, video call quality
- **Reliability:** Uptime percentage, error rate, failed payment rate
- **User Experience:** Time to book appointment, video call join time

### Quality Metrics
- **User Satisfaction:** App store ratings, user feedback scores
- **Doctor Satisfaction:** Doctor retention, average consultations per doctor
- **System Health:** Error rates, support ticket volume

### Target KPIs (Q1 2025)
- 1000+ registered patients
- 50+ verified doctors
- 500+ completed appointments/month
- 95% payment success rate
- 4.5+ star average rating
- <2s average page load time

---

## Future Roadmap

### Phase 2: Enhancement (Q2 2025)
- Appointment rescheduling functionality
- Prescription refill requests
- Doctor availability management UI
- Enhanced notification preferences
- Mobile app (React Native)

### Phase 3: Advanced Features (Q3 2025)
- Admin dashboard and analytics
- Multi-language support
- Insurance integration
- Pharmacy integration for prescription fulfillment
- AI-powered symptom checker

### Phase 4: Scale (Q4 2025)
- Multi-region deployment
- Advanced analytics and reporting
- Marketing automation
- Referral program
- API for third-party integrations

---

## Appendices

### A. Glossary
- **SOAP:** Subjective, Objective, Assessment, Plan (medical note format)
- **PHI:** Protected Health Information
- **BAA:** Business Associate Agreement
- **RLS:** Row-Level Security
- **HIPAA:** Health Insurance Portability and Accountability Act

### B. References
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Daily.co HIPAA Compliance](https://docs.daily.co/docs/hipaa-compliance)
- [Paystack API Documentation](https://paystack.com/docs/api)

### C. Change Log
- **v1.0 (Jan 2025):** Initial PRD based on codebase analysis

---

**Document Status:** Active  
**Next Review Date:** March 2025  
**Document Owner:** Product Team  
**Technical Review:** Senior Software Developer