# Prisma Migration Setup Guide

This guide will help you set up Prisma with your existing Supabase PostgreSQL database.

## Prerequisites

1. Node.js 20+ installed
2. Supabase project with database already set up
3. Database connection strings (DATABASE_URL and DIRECT_URL)

## Step 1: Install Prisma

```bash
npm install prisma @prisma/client@6.2.1
```

## Step 2: Initialize Prisma (if not already done)

```bash
npx prisma init
```

This will create:
- `prisma/schema.prisma` - Already created with your schema
- `.env` - Add your database URLs here

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Database URLs (from Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Note:
# - DATABASE_URL uses pgbouncer (for connection pooling)
# - DIRECT_URL bypasses pgbouncer (for migrations)
```

**Important:** 
- Replace `[YOUR-PASSWORD]` with your Supabase database password
- Replace `[YOUR-PROJECT-REF]` with your Supabase project reference
- Get these from: Supabase Dashboard → Settings → Database → Connection string

## Step 4: Generate Prisma Client

```bash
npx prisma generate
```

This will:
- Read your `schema.prisma` file
- Generate TypeScript types
- Create Prisma Client in `node_modules/.prisma/client`

## Step 5: Introspect Existing Database (Optional)

If you want to verify the schema matches your database:

```bash
npx prisma db pull
```

This will update `schema.prisma` with the current database structure. **Note:** You already have the schema, so this is just for verification.

## Step 6: Create Prisma Client Singleton

Create `lib/prisma/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Step 7: Update Database Schema (Add super_admin role)

Since your existing schema doesn't have `super_admin` in the role enum, you need to update it:

### Option A: Using Supabase SQL (Recommended)

Run this in Supabase SQL Editor:

```sql
-- Update role check constraint to include super_admin
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('patient', 'doctor', 'admin', 'super_admin'));
```

### Option B: Using Prisma Migrate

```bash
# Create a migration to add super_admin role
npx prisma migrate dev --name add_super_admin_role --create-only

# Edit the migration file in prisma/migrations/[timestamp]_add_super_admin_role/migration.sql
# Add the SQL above

# Apply the migration
npx prisma migrate dev
```

## Step 8: Verify Connection

Create a test script `scripts/test-prisma.ts`:

```typescript
import { prisma } from '../lib/prisma/client'

async function main() {
  const profiles = await prisma.profile.findMany({
    take: 5,
  })
  console.log('Profiles:', profiles)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run it:

```bash
npx tsx scripts/test-prisma.ts
```

## Step 9: Update Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

## Step 10: Migrate Existing Code (Gradually)

You can use Prisma alongside Supabase client. Start migrating gradually:

1. **Start with new features** - Use Prisma for new code
2. **Migrate read operations** - Replace Supabase queries with Prisma
3. **Migrate write operations** - Replace Supabase mutations with Prisma
4. **Keep Supabase Auth** - Continue using Supabase for authentication

## Important Notes

### Row-Level Security (RLS)

Prisma doesn't handle RLS automatically. You have two options:

1. **Use Supabase Client for RLS-protected queries** - Keep using Supabase client where RLS is critical
2. **Use Prisma with service role** - Use Prisma with service role key (bypasses RLS) for admin operations

### Connection Pooling

- Use `DATABASE_URL` (with pgbouncer) for application queries
- Use `DIRECT_URL` (without pgbouncer) for migrations

### Supabase Auth Integration

Prisma doesn't replace Supabase Auth. Continue using:
- `@supabase/supabase-js` for authentication
- `@supabase/ssr` for server-side auth
- Prisma for database queries after authentication

## Troubleshooting

### Error: "Can't reach database server"

- Check your connection strings
- Verify Supabase project is active
- Check firewall/network settings

### Error: "The column does not exist"

- Run `npx prisma db pull` to sync schema
- Check if migrations were applied in Supabase

### Error: "Relation does not exist"

- Verify all tables exist in Supabase
- Check if you're using the correct database

### Type Errors

- Run `npx prisma generate` after schema changes
- Restart TypeScript server in your IDE

## Next Steps

1. ✅ Prisma is set up
2. ⏭️ Create Prisma client singleton (`lib/prisma/client.ts`)
3. ⏭️ Start migrating queries gradually
4. ⏭️ Update RLS policies if needed
5. ⏭️ Add Prisma to CI/CD pipeline

## Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-supabase)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
