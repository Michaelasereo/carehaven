-- Dashboard Metrics Diagnostic SQL Script
-- This script checks the actual database values for:
-- 1. Total Consultations (completed appointments in last 30 days)
-- 2. Total Revenue (sum of paid appointments in last 30 days)
-- 3. Total Patients (unique patients)

-- Set timezone for consistent date calculations
SET timezone = 'UTC';

-- Calculate date range (last 30 days)
WITH date_range AS (
  SELECT 
    date_trunc('day', NOW() - INTERVAL '30 days')::date AS start_date,
    date_trunc('day', NOW())::date + INTERVAL '1 day' - INTERVAL '1 second' AS end_date
)
SELECT 
  '=== Dashboard Metrics Diagnostic ===' AS section;

-- 1. Total Consultations (Completed appointments in last 30 days)
-- For a specific doctor (replace with actual doctor_id if needed)
WITH date_range AS (
  SELECT 
    date_trunc('day', NOW() - INTERVAL '30 days')::timestamp AS start_date,
    date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second' AS end_date
),
doctor_consultations AS (
  SELECT 
    COUNT(*) AS total_consultations,
    doctor_id,
    'last_30_days' AS period
  FROM appointments
  WHERE status = 'completed'
    AND scheduled_at >= (SELECT start_date FROM date_range)
    AND scheduled_at <= (SELECT end_date FROM date_range)
  GROUP BY doctor_id
)
SELECT 
  'Total Consultations (Last 30 Days) by Doctor' AS metric,
  doctor_id,
  total_consultations,
  (SELECT full_name FROM profiles WHERE id = doctor_id) AS doctor_name
FROM doctor_consultations
ORDER BY total_consultations DESC;

-- All-time total consultations (for comparison)
SELECT 
  'Total Consultations (All Time) by Doctor' AS metric,
  doctor_id,
  COUNT(*) AS total_consultations,
  (SELECT full_name FROM profiles WHERE id = doctor_id) AS doctor_name
FROM appointments
WHERE status = 'completed'
GROUP BY doctor_id
ORDER BY total_consultations DESC;

-- 2. Total Revenue (Paid appointments in last 30 days)
WITH date_range AS (
  SELECT 
    date_trunc('day', NOW() - INTERVAL '30 days')::timestamp AS start_date,
    date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second' AS end_date
),
doctor_revenue AS (
  SELECT 
    doctor_id,
    COUNT(*) AS paid_appointments_count,
    SUM(amount) AS total_revenue_raw,
    SUM(amount) / 100.0 AS total_revenue_naira
  FROM appointments
  WHERE payment_status = 'paid'
    AND scheduled_at >= (SELECT start_date FROM date_range)
    AND scheduled_at <= (SELECT end_date FROM date_range)
  GROUP BY doctor_id
)
SELECT 
  'Total Revenue (Last 30 Days) by Doctor' AS metric,
  doctor_id,
  paid_appointments_count,
  total_revenue_raw,
  ROUND(total_revenue_naira) AS total_revenue_naira,
  '₦' || TO_CHAR(ROUND(total_revenue_naira), 'FM999,999,999') AS formatted_revenue,
  (SELECT full_name FROM profiles WHERE id = doctor_id) AS doctor_name
FROM doctor_revenue
ORDER BY total_revenue_naira DESC;

-- All-time total revenue (for comparison)
SELECT 
  'Total Revenue (All Time) by Doctor' AS metric,
  doctor_id,
  COUNT(*) AS paid_appointments_count,
  SUM(amount) AS total_revenue_raw,
  ROUND(SUM(amount) / 100.0) AS total_revenue_naira,
  '₦' || TO_CHAR(ROUND(SUM(amount) / 100.0), 'FM999,999,999') AS formatted_revenue,
  (SELECT full_name FROM profiles WHERE id = doctor_id) AS doctor_name
FROM appointments
WHERE payment_status = 'paid'
GROUP BY doctor_id
ORDER BY total_revenue_naira DESC;

-- 3. Total Patients
-- Option A: Total unique patients (all patients in profiles table)
SELECT 
  'Total Patients (All Profiles)' AS metric,
  COUNT(*) AS total_patients
FROM profiles
WHERE role = 'patient';

-- Option B: Total unique patients who have appointments with a specific doctor
SELECT 
  'Total Unique Patients by Doctor' AS metric,
  doctor_id,
  COUNT(DISTINCT patient_id) AS unique_patients,
  (SELECT full_name FROM profiles WHERE id = doctor_id) AS doctor_name
FROM appointments
WHERE patient_id IS NOT NULL
GROUP BY doctor_id
ORDER BY unique_patients DESC;

-- Option C: Total unique patients who have appointments (any doctor)
SELECT 
  'Total Unique Patients (All Doctors)' AS metric,
  COUNT(DISTINCT patient_id) AS unique_patients
FROM appointments
WHERE patient_id IS NOT NULL;

-- 4. Summary for Admin Dashboard (All doctors combined)
WITH date_range AS (
  SELECT 
    date_trunc('day', NOW() - INTERVAL '30 days')::timestamp AS start_date,
    date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second' AS end_date
)
SELECT 
  '=== Admin Dashboard Summary (Last 30 Days) ===' AS section;

WITH date_range AS (
  SELECT 
    date_trunc('day', NOW() - INTERVAL '30 days')::timestamp AS start_date,
    date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second' AS end_date
)
SELECT 
  'Total Consultations (All Doctors)' AS metric,
  COUNT(*) AS count
FROM appointments
WHERE status = 'completed'
  AND scheduled_at >= (SELECT start_date FROM date_range)
  AND scheduled_at <= (SELECT end_date FROM date_range);

WITH date_range AS (
  SELECT 
    date_trunc('day', NOW() - INTERVAL '30 days')::timestamp AS start_date,
    date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second' AS end_date
)
SELECT 
  'Total Revenue (All Doctors)' AS metric,
  COUNT(*) AS paid_appointments_count,
  SUM(amount) AS total_revenue_raw,
  ROUND(SUM(amount) / 100.0) AS total_revenue_naira,
  '₦' || TO_CHAR(ROUND(SUM(amount) / 100.0), 'FM999,999,999') AS formatted_revenue
FROM appointments
WHERE payment_status = 'paid'
  AND scheduled_at >= (SELECT start_date FROM date_range)
  AND scheduled_at <= (SELECT end_date FROM date_range);

SELECT 
  'Total Patients (All Profiles)' AS metric,
  COUNT(*) AS total_patients
FROM profiles
WHERE role = 'patient';

SELECT 
  'Total Appointments (All Time)' AS metric,
  COUNT(*) AS total_appointments
FROM appointments;

-- 5. Sample appointments for verification
SELECT 
  '=== Sample Appointments (Last 5) ===' AS section;

SELECT 
  id,
  doctor_id,
  patient_id,
  status,
  payment_status,
  amount,
  scheduled_at,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - scheduled_at)) / 86400 AS days_ago_scheduled,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS days_ago_created,
  CASE 
    WHEN scheduled_at >= date_trunc('day', NOW() - INTERVAL '30 days')::timestamp 
         AND scheduled_at <= (date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second')
    THEN 'YES'
    ELSE 'NO'
  END AS in_last_30_days,
  (SELECT full_name FROM profiles WHERE id = appointments.doctor_id) AS doctor_name,
  (SELECT full_name FROM profiles WHERE id = appointments.patient_id) AS patient_name
FROM appointments
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check for timezone/date issues
SELECT 
  '=== Date Analysis (Recent Appointments) ===' AS section;

SELECT 
  id,
  status,
  payment_status,
  scheduled_at,
  created_at,
  NOW() AS current_time,
  NOW() AT TIME ZONE 'UTC' AS current_time_utc,
  scheduled_at AT TIME ZONE 'UTC' AS scheduled_at_utc,
  created_at AT TIME ZONE 'UTC' AS created_at_utc,
  EXTRACT(EPOCH FROM (NOW() - scheduled_at)) / 86400 AS days_between_now_and_scheduled,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS days_between_now_and_created,
  EXTRACT(EPOCH FROM (scheduled_at - created_at)) / 86400 AS days_between_created_and_scheduled,
  CASE 
    WHEN scheduled_at < created_at THEN 'WARNING: scheduled_at is BEFORE created_at'
    WHEN scheduled_at > created_at + INTERVAL '1 year' THEN 'WARNING: scheduled_at is more than 1 year after created_at'
    ELSE 'OK'
  END AS date_consistency_check
FROM appointments
ORDER BY created_at DESC
LIMIT 10;

-- 7. Appointment status breakdown
SELECT 
  '=== Appointment Status Breakdown ===' AS section;

SELECT 
  status,
  payment_status,
  COUNT(*) AS count,
  COUNT(CASE WHEN scheduled_at >= date_trunc('day', NOW() - INTERVAL '30 days')::timestamp 
             AND scheduled_at <= (date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second')
        THEN 1 END) AS count_last_30_days
FROM appointments
GROUP BY status, payment_status
ORDER BY status, payment_status;
