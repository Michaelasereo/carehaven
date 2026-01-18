-- Fix audit_logs foreign key to allow user deletion
-- Change from RESTRICT (default) to SET NULL so audit logs are preserved
-- but user can still be deleted

-- Drop existing foreign key constraint
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Recreate with ON DELETE SET NULL
-- This preserves audit logs for compliance but allows user deletion
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also fix system_settings if it has the same issue
ALTER TABLE system_settings
DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;

ALTER TABLE system_settings
ADD CONSTRAINT system_settings_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
