-- Storage bucket policies for private investigation result files
-- Bucket: investigations (private)
-- Object key format: {investigationId}/{timestamp}.{ext}
--
-- Allows:
-- - Patient to upload and read their own investigation files
-- - Assigned doctor to read the patient's investigation files
--
-- NOTE: If this migration fails with "must be owner of table objects",
-- you need to create these policies through the Supabase Dashboard.
-- See INVESTIGATIONS_STORAGE_SETUP.md for detailed instructions.
--
-- RLS on storage.objects is typically already enabled by default in Supabase

-- Step 1: Create helper function to extract investigation UUID from object name
-- This function is required by the policies below
CREATE OR REPLACE FUNCTION public.investigation_id_from_object_name(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(split_part(object_name, '/', 1), '')::uuid;
$$;

-- Patients can upload results for investigations they own
DROP POLICY IF EXISTS "Patients can upload investigation files" ON storage.objects;
CREATE POLICY "Patients can upload investigation files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'investigations'
    AND EXISTS (
      SELECT 1
      FROM public.investigations i
      WHERE i.id = public.investigation_id_from_object_name(name)
        AND i.patient_id = auth.uid()
    )
  );

-- Patients + assigned doctors can read investigation files
DROP POLICY IF EXISTS "Users can read investigation files" ON storage.objects;
CREATE POLICY "Users can read investigation files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'investigations'
    AND EXISTS (
      SELECT 1
      FROM public.investigations i
      WHERE i.id = public.investigation_id_from_object_name(name)
        AND (i.patient_id = auth.uid() OR i.doctor_id = auth.uid())
    )
  );

