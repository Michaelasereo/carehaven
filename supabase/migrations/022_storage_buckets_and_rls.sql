-- Note: Storage buckets and RLS policies need to be set up through the Supabase Dashboard
-- See STORAGE_RLS_SETUP.md for detailed instructions

-- This migration only creates the buckets (if you have permission)
-- Storage RLS policies must be created through the Dashboard Storage UI

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- Create investigations bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public)
VALUES ('investigations', 'investigations', false)
ON CONFLICT (id) DO NOTHING;
