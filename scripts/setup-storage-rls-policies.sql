-- Storage RLS Policies Setup
-- Run this SQL in Supabase SQL Editor
-- Note: If you get permission errors, these policies must be set up through the Dashboard UI (see STORAGE_RLS_SETUP.md)

-- Enable RLS on storage.objects (if not already enabled)
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS may already be enabled: %', SQLERRM;
END $$;

-- Drop existing policies if they exist (to allow clean recreation)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload investigation results" ON storage.objects;
DROP POLICY IF EXISTS "Users can read investigation results" ON storage.objects;
DROP POLICY IF EXISTS "Users can update investigation results" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete investigation results" ON storage.objects;

-- RLS Policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- RLS Policies for investigations bucket
-- Allow authenticated users to upload investigation results
CREATE POLICY "Patients can upload investigation results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'investigations');

-- Allow authenticated users to read investigation results
CREATE POLICY "Users can read investigation results"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'investigations');

-- Allow authenticated users to update investigation results
CREATE POLICY "Users can update investigation results"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'investigations');

-- Allow authenticated users to delete investigation results
CREATE POLICY "Users can delete investigation results"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'investigations');
