# Investigations Storage Policies Setup

If migration `026_investigations_storage_policies.sql` fails with "must be owner of table objects", set up the policies through the Supabase Dashboard.

## Option 1: Supabase Dashboard (Recommended)

1. **Go to Storage → Policies** in your Supabase Dashboard
2. **Select the `investigations` bucket**
3. **Create the following policies:**

### Policy 1: Patients can upload investigation files

- **Policy name**: `Patients can upload investigation files`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (
    bucket_id = 'investigations'
    AND EXISTS (
      SELECT 1
      FROM public.investigations i
      WHERE i.id = public.investigation_id_from_object_name(name)
        AND i.patient_id = auth.uid()
    )
  )
  ```

### Policy 2: Users can read investigation files

- **Policy name**: `Users can read investigation files`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (
    bucket_id = 'investigations'
    AND EXISTS (
      SELECT 1
      FROM public.investigations i
      WHERE i.id = public.investigation_id_from_object_name(name)
        AND (i.patient_id = auth.uid() OR i.doctor_id = auth.uid())
    )
  )
  ```

### Important: Create Helper Function First

Before creating the policies, you need to create the helper function. Go to **SQL Editor** and run:

```sql
CREATE OR REPLACE FUNCTION public.investigation_id_from_object_name(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(split_part(object_name, '/', 1), '')::uuid;
$$;
```

## Option 2: Using Supabase CLI with Service Role

If you have access to the Supabase CLI and service role key:

1. Set your service role key:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Connect to your database with service role permissions and run:
   ```sql
   -- From supabase/migrations/026_investigations_storage_policies.sql
   ```

## Verification

After setting up the policies:

1. **Test upload**: As a patient, try uploading an investigation result file
2. **Test view**: As the assigned doctor, try viewing the uploaded file
3. **Test access control**: Verify that other users cannot access files they shouldn't

## Troubleshooting

- **"function investigation_id_from_object_name does not exist"**: Make sure you created the helper function first (see above)
- **"Bucket not found"**: Ensure the `investigations` bucket exists (from migration `022_storage_buckets_and_rls.sql`)
- **403 Forbidden on upload**: Check that the INSERT policy is correctly configured
- **403 Forbidden on view**: Check that the SELECT policy is correctly configured and the user is either the patient or assigned doctor
