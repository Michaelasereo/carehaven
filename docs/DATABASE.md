# Database Architecture

Technical schema and RLS for Care Haven. Use this with a fresh Supabase (or PostgreSQL) project.

**Single script:** Run [docs/schema.sql](schema.sql) in the Supabase SQL Editor to create all tables, constraints, indexes, triggers, and RLS in one go.

**Incremental:** Alternatively, run migrations in `supabase/migrations/` in filename order.

---

## Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends `auth.users`). Patient and doctor fields. |
| `appointments` | Consultations between patient and doctor; payment and video fields. |
| `consultation_notes` | SOAP notes and diagnosis per appointment. |
| `prescriptions` | Prescriptions linked to appointment/patient/doctor. |
| `investigations` | Lab/investigation requests and results. |
| `notifications` | In-app notifications per user. |
| `messages` | Chat messages; optional appointment link. |
| `doctor_availability` | Weekly availability slots per doctor. |
| `audit_logs` | Audit trail for sensitive table changes. |
| `system_settings` | Single-row app config (e.g. consultation price). |
| `faqs` | FAQ entries; display order and active flag. |

---

## 1. profiles

Extends Supabase `auth.users`. One row per user; role drives access.

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK, FK → auth.users(id) ON DELETE CASCADE |
| role | text | NO | 'patient' | CHECK: patient, doctor, admin, super_admin |
| full_name | text | YES | |
| avatar_url | text | YES | |
| email | text | YES | UNIQUE |
| profile_completed | boolean | NO | false |
| onboarded_at | timestamptz | YES | |
| date_of_birth | date | YES | |
| gender | text | YES | CHECK: male, female, other |
| phone | text | YES | |
| blood_group | text | YES | |
| allergies | text[] | NO | '{}' |
| chronic_conditions | text[] | NO | '{}' |
| occupation | text | YES | |
| marital_status | text | YES | |
| license_number | text | YES | UNIQUE |
| license_verified | boolean | NO | false |
| specialty | text | YES | |
| years_experience | text | YES | |
| consultation_fee | decimal(10,2) | YES | 20000.00 |
| currency | text | YES | 'NGN' |
| bio | text | YES | |
| notification_preferences | jsonb | YES | {"email":true,"sms":true} |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

Later migrations may add e.g. `age` (030). Check `supabase/migrations/` for full list.

**RLS**

- **SELECT:** User can read own row (`auth.uid() = id`). Doctors can read rows where `role = 'patient'`. Admins/super_admins can read all (via `is_current_user_admin()`). Authenticated users can read verified doctors (`role = 'doctor' AND license_verified = true`).
- **INSERT:** Allowed for profile creation (trigger `handle_new_user` and fallback); policy `WITH CHECK (true)`.
- **UPDATE:** User can update own row only (`auth.uid() = id`).

---

## 2. appointments

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK, default uuid_generate_v4() |
| patient_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| doctor_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| scheduled_at | timestamptz | NO | |
| duration_minutes | integer | NO | 30 |
| status | text | NO | 'scheduled' | CHECK: scheduled, confirmed, in_progress, completed, cancelled, no_show |
| chief_complaint | text | YES | |
| symptoms_description | text | YES | |
| daily_room_name | text | YES | UNIQUE |
| daily_room_url | text | YES | |
| recording_id | text | YES | |
| recording_url | text | YES | |
| amount | decimal(10,2) | YES | |
| currency | text | YES | 'NGN' |
| paystack_reference | text | YES | |
| payment_status | text | NO | 'pending' | CHECK: pending, paid, failed, refunded, waived |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Patient or doctor of the appointment; admins/super_admins (via `is_current_user_admin()`).
- **INSERT:** Patient as `patient_id`; or admin/super_admin.
- **UPDATE:** Patient or doctor of the appointment; or admin/super_admin.

---

## 3. consultation_notes

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| appointment_id | uuid | NO | FK → appointments(id) ON DELETE CASCADE |
| doctor_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| subjective | text | YES | |
| objective | text | YES | |
| assessment | text | YES | |
| plan | text | YES | |
| diagnosis | text | YES | |
| prescription | jsonb | YES | |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Doctor who wrote the note or patient of the linked appointment.
- **INSERT:** Authenticated user must be the `doctor_id`.
- **UPDATE:** Authenticated user must be the `doctor_id`.

---

## 4. prescriptions

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| appointment_id | uuid | NO | FK → appointments(id) ON DELETE CASCADE |
| patient_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| doctor_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| medications | jsonb | NO | |
| instructions | text | YES | |
| duration_days | integer | YES | |
| refills_remaining | integer | NO | 0 |
| status | text | NO | 'active' | CHECK: active, filled, expired, cancelled |
| filled_at | timestamptz | YES | |
| expires_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Patient or doctor of the prescription.
- **INSERT:** Authenticated user must be the `doctor_id`.

---

## 5. investigations

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| appointment_id | uuid | NO | FK → appointments(id) ON DELETE CASCADE |
| patient_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| doctor_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| test_name | text | NO | |
| test_type | text | YES | |
| status | text | NO | 'requested' | CHECK: requested, in_progress, completed, cancelled |
| requested_at | timestamptz | NO | now() |
| completed_at | timestamptz | YES | |
| results_url | text | YES | |
| results_text | text | YES | |
| interpretation | text | YES | |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Patient or doctor of the investigation.
- **INSERT:** Authenticated user must be the `doctor_id`.
- **UPDATE:** Patient or doctor of the investigation.

---

## 6. notifications

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| type | text | NO | CHECK: appointment, prescription, investigation, message, system |
| title | text | NO | |
| body | text | YES | |
| data | jsonb | YES | |
| read | boolean | NO | false |
| read_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |

**RLS**

- **SELECT / UPDATE:** Only the user who owns the notification (`auth.uid() = user_id`).

---

## 7. messages

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| sender_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| receiver_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| appointment_id | uuid | YES | FK → appointments(id) ON DELETE SET NULL |
| content | text | NO | |
| attachments | jsonb | YES | |
| read | boolean | NO | false |
| read_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Sender or receiver.
- **INSERT:** Authenticated user must be the `sender_id`.
- **UPDATE:** Authenticated user must be the `receiver_id` (e.g. mark as read).

---

## 8. doctor_availability

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| doctor_id | uuid | NO | FK → profiles(id) ON DELETE CASCADE |
| day_of_week | integer | NO | 0–6 |
| start_time | time | NO | |
| end_time | time | NO | |
| active | boolean | NO | true |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

UNIQUE(doctor_id, day_of_week, start_time).

**RLS**

- **SELECT:** Anyone (for booking).
- **INSERT/UPDATE/DELETE:** Only the doctor who owns the row (`auth.uid() = doctor_id`).

---

## 9. audit_logs

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| user_id | uuid | YES | FK → auth.users(id) ON DELETE SET NULL |
| action | text | NO | |
| table_name | text | YES | |
| record_id | uuid | YES | |
| old_data | jsonb | YES | |
| new_data | jsonb | YES | |
| ip_address | inet | YES | |
| user_agent | text | YES | |
| created_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Admins/super_admins only (via role check or `is_current_user_admin()`).
- **INSERT:** Allowed (e.g. from triggers or service role).

---

## 10. system_settings

Single-row configuration.

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| consultation_price | decimal(10,2) | NO | 5000.00 |
| currency | text | YES | 'NGN' |
| updated_by | uuid | YES | FK → auth.users(id) ON DELETE SET NULL |
| updated_at | timestamptz | NO | now() |

**RLS**

- **SELECT:** Any authenticated user.
- **UPDATE:** Admins/super_admins only.

---

## 11. faqs

**Columns**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | PK |
| question | text | NO | |
| answer | text | NO | |
| display_order | integer | NO | 0 |
| is_active | boolean | NO | true |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| created_by | uuid | YES | FK → auth.users(id) ON DELETE SET NULL |
| updated_by | uuid | YES | FK → auth.users(id) ON DELETE SET NULL |

**RLS**

- **SELECT:** Public (anon + authenticated) can read active FAQs; admins can read all.
- **INSERT/UPDATE/DELETE:** Admins/super_admins only.

---

## Storage (Supabase Storage)

Buckets and RLS are created in migrations (e.g. `022_storage_buckets_and_rls.sql`, `026_investigations_storage_policies.sql`):

- **avatars:** Public; RLS for read/write by profile owner.
- **investigations:** Private; RLS so patient and linked doctor can access relevant objects.

Policies are defined in SQL or via Dashboard; see those migration files and any project docs for exact policy names and conditions.

---

## Migration order

Run files under `supabase/migrations/` in lexicographic order. Key sequence: `001_initial_schema.sql`, then `002_rls_policies.sql` (and `002_audit_logs.sql` if present; note possible conflict with `004_audit_logging.sql`—ensure only one audit_logs definition is applied), `003_indexes.sql`, `004_audit_logging.sql`, `005_realtime_setup.sql`, then remaining numbered migrations. Do not run seed files (e.g. `007_seed_test_doctors.sql`) on production unless intended.

---

## Helper used by RLS

- **is_current_user_admin()** (SECURITY DEFINER): Returns true if `auth.uid()` has role `admin` or `super_admin` in `profiles`. Used in profile and appointment admin policies to avoid recursive RLS.
