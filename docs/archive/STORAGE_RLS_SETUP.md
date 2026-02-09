# Storage RLS Policies Setup Guide

Since storage RLS policies require elevated privileges, they must be created through the Supabase Dashboard Storage UI.

## Step 1: Create Storage Buckets (if not already created)

The buckets should be created automatically by the migration, but if they don't exist:

1. Go to **Storage** in your Supabase Dashboard
2. Click **New bucket**
3. Create the following buckets:

### `avatars` Bucket
- **Name**: `avatars`
- **Public bucket**: ✅ **YES** (toggle on)
- **File size limit**: `5242880` (5MB)
- **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

### `investigations` Bucket
- **Name**: `investigations`
- **Public bucket**: ❌ **NO** (toggle off)
- **File size limit**: `10485760` (10MB)
- **Allowed MIME types**: `application/pdf,image/jpeg,image/png,image/gif`

## Step 2: Set Up RLS Policies for `avatars` Bucket

1. Go to **Storage** → **Policies** → Select `avatars` bucket
2. Click **New Policy** for each policy below:

### Policy 1: Users can upload own avatar
- **Policy name**: `Users can upload own avatar`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```

### Policy 2: Users can update own avatar
- **Policy name**: `Users can update own avatar`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```

### Policy 3: Users can delete own avatar
- **Policy name**: `Users can delete own avatar`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```

### Policy 4: Public can read avatars
- **Policy name**: `Public can read avatars`
- **Allowed operation**: `SELECT`
- **Target roles**: `anon`, `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'avatars')
  ```

## Step 3: Set Up RLS Policies for `investigations` Bucket

1. Go to **Storage** → **Policies** → Select `investigations` bucket
2. Click **New Policy** for each policy below:

### Policy 1: Users can upload investigation results
- **Policy name**: `Patients can upload investigation results`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'investigations')
  ```

### Policy 2: Users can read investigation results
- **Policy name**: `Users can read investigation results`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'investigations')
  ```

### Policy 3: Users can update investigation results
- **Policy name**: `Users can update investigation results`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'investigations')
  ```

### Policy 4: Users can delete investigation results
- **Policy name**: `Users can delete investigation results`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  (bucket_id = 'investigations')
  ```

## Alternative: Quick Setup via SQL (Requires Service Role)

If you have access to the service role key, you can run this SQL in a function or with elevated privileges:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- RLS Policies for investigations bucket
CREATE POLICY "Patients can upload investigation results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'investigations');

CREATE POLICY "Users can read investigation results"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'investigations');

CREATE POLICY "Users can update investigation results"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'investigations');

CREATE POLICY "Users can delete investigation results"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'investigations');
```

## Verification

After setting up the policies, test the upload functionality:
1. Go to the doctor profile page
2. Click "Edit" and try uploading a profile picture
3. The upload should succeed without RLS errors

## Troubleshooting

- **"must be owner of table objects"**: Use the Dashboard UI method instead
- **Upload still failing**: Check that the bucket exists and policies are correctly configured
- **403 Forbidden**: Verify the policy definitions match the file path structure (`${user.id}/filename`)
