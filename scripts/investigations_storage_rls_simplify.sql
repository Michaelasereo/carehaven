-- Simplify Storage RLS policies for investigations bucket (run in Supabase SQL editor with sufficient privileges)
-- Goal: stop Storage masking access issues as "Object not found" during signed URL generation.
--
-- NOTE:
-- - Some projects cannot modify storage.objects policies from SQL editor without elevated privileges.
--   If you get "must be owner of table objects", apply via Supabase Dashboard -> Storage -> Policies.
-- - This keeps the bucket private/public setting unchanged; policies control access.

-- Drop complex policies (if present)
DROP POLICY IF EXISTS "Patients can upload investigation files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read investigation files" ON storage.objects;

-- Drop simple policies (if present) to avoid duplicates/conflicts
DROP POLICY IF EXISTS "Patients can upload investigation results" ON storage.objects;
DROP POLICY IF EXISTS "Users can read investigation results" ON storage.objects;
DROP POLICY IF EXISTS "Users can update investigation results" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete investigation results" ON storage.objects;

-- Create simple policies scoped to authenticated users.
-- Upload: allow INSERT into investigations bucket (application/db controls which investigation gets marked completed)
CREATE POLICY "Authenticated users can upload investigations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'investigations');

-- Read: allow SELECT from investigations bucket.
-- Access control should be enforced by the application when issuing signed URLs.
CREATE POLICY "Authenticated users can read investigations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'investigations');

-- Optional: allow UPDATE/DELETE (only if your app needs it)
-- CREATE POLICY "Authenticated users can update investigations"
--   ON storage.objects FOR UPDATE
--   TO authenticated
--   USING (bucket_id = 'investigations');
--
-- CREATE POLICY "Authenticated users can delete investigations"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'investigations');

