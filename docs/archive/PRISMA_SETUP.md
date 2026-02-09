# Prisma Setup Guide - Care Haven

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Guide for setting up Prisma ORM with existing Supabase database

---

## Overview

This guide will help you set up Prisma 6.2.1 with your existing Supabase PostgreSQL database. Prisma will provide type-safe database access alongside your existing Supabase client.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install prisma @prisma/client@6.2.1
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Prisma Database URLs
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

**Get these from:** Supabase Dashboard → Settings → Database → Connection string

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Update Database Schema (Add super_admin role)

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('patient', 'doctor', 'admin', 'super_admin'));
```

Or use the migration file: `prisma/migrations/001_add_super_admin_role.sql`

### 5. Test Connection

```bash
npx tsx scripts/test-prisma.ts
```

---

## File Structure

```
carehaven/
├── prisma/
│   ├── schema.prisma              # Prisma schema (already created)
│   ├── migrations/
│   │   ├── README.md              # Migration guide
│   │   └── 001_add_super_admin_role.sql
├── lib/
│   └── prisma/
│       └── client.ts              # Prisma client singleton
└── scripts/
    └── test-prisma.ts             # Connection test script
```

---

## Usage Examples

### Basic Query

```typescript
import { prisma } from '@/lib/prisma/client'

// Find all patients
const patients = await prisma.profile.findMany({
  where: { role: 'patient' },
})

// Find doctor with appointments
const doctor = await prisma.profile.findUnique({
  where: { id: doctorId },
  include: {
    doctorAppointments: {
      where: { status: 'confirmed' },
    },
  },
})
```

### Create Record

```typescript
// Create appointment
const appointment = await prisma.appointment.create({
  data: {
    patientId: patient.id,
    doctorId: doctor.id,
    scheduledAt: new Date(),
    status: 'scheduled',
  },
})
```

### Update Record

```typescript
// Update appointment status
await prisma.appointment.update({
  where: { id: appointmentId },
  data: { status: 'completed' },
})
```

### Complex Query with Relations

```typescript
// Get patient with all appointments and prescriptions
const patient = await prisma.profile.findUnique({
  where: { id: patientId },
  include: {
    patientAppointments: {
      include: {
        doctor: {
          select: {
            fullName: true,
            specialty: true,
          },
        },
        prescriptions: true,
        investigations: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    },
  },
})
```

---

## Integration with Supabase

### Continue Using Supabase For:

1. **Authentication** - Keep using `@supabase/supabase-js` for auth
2. **RLS-Protected Queries** - Use Supabase client where RLS is critical
3. **Realtime** - Use Supabase Realtime for live updates
4. **Storage** - Use Supabase Storage for file uploads

### Use Prisma For:

1. **Type-Safe Queries** - Better TypeScript support
2. **Complex Relations** - Easier relation queries
3. **Admin Operations** - Service role queries (bypasses RLS)
4. **Migrations** - Database schema versioning

---

## Migration Strategy

### Phase 1: Setup (Week 1)
- ✅ Install Prisma
- ✅ Generate schema from existing database
- ✅ Create Prisma client singleton
- ✅ Test connection

### Phase 2: Gradual Migration (Week 2-3)
- Start with new features using Prisma
- Migrate read operations (queries)
- Migrate write operations (mutations)
- Keep Supabase for auth and RLS

### Phase 3: Full Integration (Week 4+)
- Use Prisma for all database operations
- Keep Supabase only for auth, realtime, storage
- Add Prisma migrations for schema changes

---

## Important Notes

### Row-Level Security (RLS)

Prisma doesn't automatically enforce RLS. Options:

1. **Use Supabase Client** - For RLS-protected queries
2. **Service Role** - Use Prisma with service role for admin operations
3. **Manual Checks** - Add role checks in application code

### Connection Pooling

- **DATABASE_URL** - Uses pgbouncer (for app queries)
- **DIRECT_URL** - Bypasses pgbouncer (for migrations)

### Type Safety

Prisma provides:
- Auto-completion in IDE
- Type checking at compile time
- Runtime type validation
- Better error messages

---

## Troubleshooting

### "Can't reach database server"
- Check connection strings
- Verify Supabase project is active
- Check network/firewall

### "Column does not exist"
- Run `npx prisma db pull` to sync
- Check if migrations were applied

### "Relation does not exist"
- Verify tables exist in Supabase
- Check database connection

### Type Errors
- Run `npx prisma generate`
- Restart TypeScript server

---

## Package.json Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:test": "tsx scripts/test-prisma.ts"
  }
}
```

---

## Next Steps

1. ✅ Prisma is set up
2. ⏭️ Add super_admin role to database
3. ⏭️ Test connection
4. ⏭️ Start migrating queries
5. ⏭️ Update API routes to use Prisma

---

**Document Status:** Complete  
**Owner:** Development Team  
**Last Updated:** January 2025
