# Storage Buckets Setup Guide

## Required Supabase Storage Buckets

The application requires the following storage buckets for file uploads:

### 1. `avatars` Bucket
- **Purpose**: Store user profile photos (patients and doctors)
- **Public Access**: Yes (for displaying profile pictures)
- **Max File Size**: 5MB
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### 2. `investigations` Bucket
- **Purpose**: Store investigation/test result files uploaded by patients
- **Public Access**: No (private, requires authentication)
- **Max File Size**: 10MB
- **Allowed MIME Types**: `application/pdf`, `image/jpeg`, `image/png`, `image/gif`

## Setup Instructions

### Option 1: Via Supabase Dashboard

1. **Navigate to Storage**
   - Go to your Supabase project dashboard
   - Click on "Storage" in the left sidebar

2. **Create `avatars` Bucket**
   - Click "New bucket"
   - Name: `avatars`
   - Public bucket: **YES** (toggle on)
   - File size limit: `5242880` (5MB in bytes)
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`
   - Click "Create bucket"

3. **Create `investigations` Bucket**
   - Click "New bucket"
   - Name: `investigations`
   - Public bucket: **NO** (toggle off)
   - File size limit: `10485760` (10MB in bytes)
   - Allowed MIME types: `application/pdf,image/jpeg,image/png,image/gif`
   - Click "Create bucket"

4. **Set Up RLS Policies**

   For `avatars` bucket:
   ```sql
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

   -- Allow public read access
   CREATE POLICY "Public can read avatars"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'avatars');
   ```

   For `investigations` bucket:
   ```sql
   -- Allow authenticated users to upload investigation results
   CREATE POLICY "Patients can upload investigation results"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'investigations'
   );

   -- Allow patients and doctors to read investigation results
   CREATE POLICY "Users can read investigation results"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'investigations');
   ```

### Option 2: Via SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Create avatars bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create investigations bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('investigations', 'investigations', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for avatars (as above)
-- RLS Policies for investigations (as above)
```

## Verification

After setup, verify buckets exist:
1. Go to Storage in Supabase dashboard
2. You should see both `avatars` and `investigations` buckets
3. Test upload functionality in the app

## Troubleshooting

- **Upload fails**: Check bucket exists and RLS policies are set
- **Access denied**: Verify RLS policies match user role
- **File too large**: Check bucket file size limit settings
