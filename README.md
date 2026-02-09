# Care Haven

Telemedicine platform: patients book video consultations with doctors, manage prescriptions and investigations, and pay via Paystack. Built for a clean handoff to your own infra.

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Video:** Daily.co
- **Payments:** Paystack
- **Email:** Brevo (or similar)
- **Deploy:** Netlify

## Getting started

```bash
npm install
cp .env.example .env.local
# Populate .env.local (see Environment configuration below)
# Run DB migrations in Supabase (see Database)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment configuration

You need your own infrastructure. No shared Supabase URL or keys are provided.

1. **Supabase:** Create a project at [database.new](https://database.new) (or [supabase.com](https://supabase.com)).
2. **Env vars:** Rename `.env.example` to `.env.local` and fill values from the Supabase Dashboard (Settings > API) and from Paystack, Daily.co, and your email provider.
3. **Database:** Run the SQL migrations in `supabase/migrations/` in filename order to create tables and RLS. For schema and policy details, see [docs/DATABASE.md](docs/DATABASE.md).

## Database

Full schema and RLS (who can read/write each table) are in **[docs/DATABASE.md](docs/DATABASE.md)**. To initialize the database, either run **`docs/schema.sql`** once in the Supabase SQL Editor, or apply migrations from `supabase/migrations/` in order.

## Deployment

The app is set up for Netlify. Configure the same environment variables in the Netlify dashboard and see `netlify.toml` for build settings.

## License

MIT
