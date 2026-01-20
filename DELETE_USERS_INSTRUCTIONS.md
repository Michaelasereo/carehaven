# How to Delete Users - Step by Step Guide

## ⚠️ IMPORTANT: Use SQL Files, NOT TypeScript Files

When running SQL in Supabase SQL Editor, you must use `.sql` files, NOT `.ts` files.

## Option 1: Create the Cascade Function (Required First Step)

1. **Open Supabase Dashboard** → Go to SQL Editor
2. **Open this file**: `supabase/migrations/021_delete_user_cascade_function.sql`
3. **Copy the ENTIRE contents** (it's pure SQL, starts with `CREATE OR REPLACE FUNCTION`)
4. **Paste into SQL Editor** and click "Run"
5. You should see: "Success. No rows returned"

## Option 2: Delete Specific Users (After Step 1)

### Method A: Using the Cascade Function (Recommended)

1. **Open**: `scripts/quick-delete-users.sql`
2. **Modify the email list** in the `target_emails` array (around line 10)
3. **Copy the SQL code** (the part inside the `DO $$ ... END $$;` block)
4. **Paste into Supabase SQL Editor** and run

### Method B: Using TypeScript Script

```bash
# 1. Edit the TARGET_EMAILS array in scripts/force-delete-users.ts
# 2. Run the script:
npx tsx scripts/force-delete-users.ts
```

## Option 3: Delete All Non-Admin Users

```bash
npx tsx scripts/clear-users-except-admin.ts
```

## Quick Reference: Which File to Use Where

| File | Where to Use | Purpose |
|------|-------------|---------|
| `supabase/migrations/021_delete_user_cascade_function.sql` | **Supabase SQL Editor** | Creates the cascade delete function (run once) |
| `scripts/quick-delete-users.sql` | **Supabase SQL Editor** | Delete specific users via SQL |
| `scripts/force-delete-users.ts` | **Terminal/Command Line** | Delete specific users via Node.js |
| `scripts/clear-users-except-admin.ts` | **Terminal/Command Line** | Delete all non-admin users |

## Troubleshooting

### Error: "syntax error at or near '{'"
- **Cause**: You copied TypeScript code (`.ts` file) into SQL Editor
- **Fix**: Use the `.sql` file instead

### Error: "function delete_user_cascade does not exist"
- **Cause**: You haven't run the migration yet
- **Fix**: Run `021_delete_user_cascade_function.sql` first

### Error: "Database error deleting user"
- **Cause**: Foreign key constraints blocking deletion
- **Fix**: The cascade function handles this automatically - make sure you ran it first

## Step-by-Step: First Time Setup

1. ✅ Open Supabase Dashboard → SQL Editor
2. ✅ Open `supabase/migrations/021_delete_user_cascade_function.sql`
3. ✅ Copy ALL the SQL code (from `CREATE OR REPLACE FUNCTION` to the end)
4. ✅ Paste into SQL Editor
5. ✅ Click "Run"
6. ✅ You should see "Success. No rows returned"

Now you can delete users using any of the methods above!
