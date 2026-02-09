# Sign Up Migration Fixes

## Issues Found

### 1. **Missing RLS INSERT Policy for Profiles**
   - **Problem**: The `profiles` table had RLS enabled but no INSERT policy, which would prevent the `handle_new_user()` trigger from creating profiles when RLS is active.
   - **Location**: `supabase/migrations/002_rls_policies.sql` only has SELECT and UPDATE policies for profiles
   - **Impact**: Profile creation during signup would fail silently or throw errors

### 2. **Incomplete Trigger Function Error Handling**
   - **Problem**: The original trigger function in `008_auto_create_profile_trigger.sql` didn't have proper error handling or `SET search_path` specification.
   - **Impact**: Errors during profile creation wouldn't be properly logged, making debugging difficult

### 3. **Migration Inconsistency**
   - **Problem**: The Prisma migrations had a fix for the INSERT policy (`20260116132050_fix_profile_insert_policy`), but this wasn't reflected in the Supabase migrations folder.
   - **Impact**: If only Supabase migrations are run, the issue would persist

## Fixes Applied

### New Migration: `010_fix_profile_insert_policy.sql`

This migration addresses all the above issues:

1. **Updated Trigger Function**:
   - Added `SET search_path = public` to ensure proper schema resolution
   - Added exception handling with `RAISE WARNING` to log errors without failing user creation
   - Maintains `SECURITY DEFINER` to bypass RLS when needed

2. **Added INSERT Policy**:
   - Creates a permissive INSERT policy: `"Allow profile creation via trigger"`
   - Uses `WITH CHECK (true)` to allow any profile insertion via the trigger
   - This ensures the trigger can create profiles even when RLS is enabled

3. **Ensures Trigger Exists**:
   - Drops and recreates the trigger to ensure it's properly set up
   - This handles cases where the trigger might have been dropped

## How Profile Creation Works

### Flow:
1. User signs up via `supabase.auth.signUp()`
2. Supabase creates a user in `auth.users` table
3. **Trigger `on_auth_user_created` fires automatically**
4. Trigger function `handle_new_user()` executes with `SECURITY DEFINER` privileges
5. Function inserts profile into `profiles` table
6. If trigger fails, fallback in `/app/auth/callback/route.ts` creates profile manually

### Why Both Are Needed:
- **Trigger**: Automatic, happens immediately on user creation
- **Fallback in callback**: Safety net if trigger fails or is delayed

## Migration Order

The correct migration order should be:
1. `001_initial_schema.sql` - Creates profiles table
2. `002_rls_policies.sql` - Enables RLS (but missing INSERT policy)
3. `008_auto_create_profile_trigger.sql` - Creates trigger function
4. `009_add_super_admin_role.sql` - Adds super_admin role
5. `010_fix_profile_insert_policy.sql` - **Fixes INSERT policy and improves trigger** ⬅️ NEW

## Next Steps

1. **Apply the new migration** to your Supabase database:
   ```sql
   -- Run the migration 010_fix_profile_insert_policy.sql
   ```

2. **Test sign up** to verify profile creation works:
   - Sign up with a new email
   - Check that profile is created automatically
   - Verify you can access the dashboard after signup

3. **Monitor logs** for any `RAISE WARNING` messages from the trigger function

## Verification

To verify the fix is working:

```sql
-- Check if the INSERT policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Allow profile creation via trigger';

-- Check if trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check trigger function
SELECT * FROM pg_proc 
WHERE proname = 'handle_new_user';
```

## Related Files

- `supabase/migrations/010_fix_profile_insert_policy.sql` - New fix migration
- `supabase/migrations/008_auto_create_profile_trigger.sql` - Original trigger
- `supabase/migrations/002_rls_policies.sql` - RLS policies (missing INSERT)
- `app/auth/callback/route.ts` - Fallback profile creation
- `prisma/migrations/20260116132050_fix_profile_insert_policy/migration.sql` - Prisma equivalent
