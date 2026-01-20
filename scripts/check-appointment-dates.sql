-- Simple query to check appointment dates
-- This will show when appointments were created vs when they're scheduled

SELECT 
  id,
  status,
  payment_status,
  amount,
  -- Show dates in readable format
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS created_at_readable,
  TO_CHAR(scheduled_at, 'YYYY-MM-DD HH24:MI:SS TZ') AS scheduled_at_readable,
  TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS TZ') AS current_time_readable,
  -- Calculate days difference
  ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400, 2) AS days_since_created,
  ROUND(EXTRACT(EPOCH FROM (NOW() - scheduled_at)) / 86400, 2) AS days_since_scheduled,
  -- Check if in last 30 days
  CASE 
    WHEN scheduled_at >= date_trunc('day', NOW() - INTERVAL '30 days')::timestamp 
         AND scheduled_at <= (date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second')
    THEN 'YES'
    ELSE 'NO'
  END AS scheduled_in_last_30_days,
  CASE 
    WHEN created_at >= date_trunc('day', NOW() - INTERVAL '30 days')::timestamp 
         AND created_at <= (date_trunc('day', NOW())::timestamp + INTERVAL '1 day' - INTERVAL '1 second')
    THEN 'YES'
    ELSE 'NO'
  END AS created_in_last_30_days,
  -- Doctor and patient names
  (SELECT full_name FROM profiles WHERE id = appointments.doctor_id) AS doctor_name,
  (SELECT full_name FROM profiles WHERE id = appointments.patient_id) AS patient_name
FROM appointments
ORDER BY created_at DESC
LIMIT 20;
