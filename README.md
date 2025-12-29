# Care Haven - Telemedicine Platform

A comprehensive telemedicine platform built with Next.js 15, Supabase, and Daily.co.

## Features

- Google OAuth authentication
- Patient and Doctor dashboards
- Video consultations via Daily.co
- Appointment booking and management
- Prescription management
- Investigation requests
- Real-time messaging
- Payment processing with Paystack
- Email notifications via Brevo
- SMS notifications via Twilio

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Video**: Daily.co (HIPAA-compliant)
- **Payments**: Paystack
- **Email**: Brevo
- **SMS**: Twilio
- **Deployment**: Netlify

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run database migrations in Supabase dashboard

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for required environment variables.

## Database Migrations

Run migrations in order:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_indexes.sql`
4. `004_audit_logging.sql`
5. `005_realtime_setup.sql`

## Deployment

The project is configured for Netlify deployment. See `netlify.toml` for configuration.

## License

MIT
