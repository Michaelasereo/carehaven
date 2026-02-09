# Care Haven - Technology Stack

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Project:** Telemedicine Platform  
**Status:** Target Architecture & Current Implementation

---

## Overview

Care Haven is built as a modern full-stack web application using Next.js 16 with the App Router, TypeScript 5.9, React 19, and Supabase as the backend. The platform follows a multi-tenant architecture with role-based access control, implementing security best practices for healthcare data.

---

## Core Framework & Language

### Next.js 16 (App Router) ✅
- **Status:** Implemented (currently 16.1.1, target 16.x)
- **Purpose:** React framework for production with App Router
- **Features Used:**
  - App Router (file-based routing)
  - Server Components (default)
  - Client Components (`'use client'` directive)
  - API Routes (Route Handlers)
  - Middleware for authentication
  - Server Actions ⚠️ (planned)
  - Image optimization
  - Route groups `(dashboard)`
- **Configuration:** `next.config.ts`
  - Remote image patterns for Supabase and Daily.co
  - Package transpilation for Edge Runtime compatibility
  - CSP headers ⚠️ (planned)

### TypeScript 5.9 ✅
- **Status:** Implemented (currently 5.9.3)
- **Purpose:** Type safety and developer experience
- **Configuration:** `tsconfig.json`
  - **Strict mode:** ✅ Enabled
  - Path aliases configured (`@/*`)
  - Target: ES2017
  - Module resolution: bundler
  - Isolated modules: true

### React 19.2.1 ✅
- **Status:** Implemented (currently 19.2.3, target 19.2.1)
- **Purpose:** UI library with latest features
- **Features:**
  - Server Components (default)
  - Client Components with `'use client'` directive
  - React Server Components streaming
  - Improved hydration

### React DOM 19.2.1 ✅
- **Status:** Implemented (currently 19.2.3, target 19.2.1)
- **Purpose:** React rendering for web

---

## Styling & UI Components

### Tailwind CSS 4 ✅
- **Status:** Implemented
- **Purpose:** Utility-first CSS framework
- **Configuration:**
  - PostCSS integration (`postcss.config.mjs`)
  - CSS Variables for theming
  - Custom configuration in `components.json`
  - `@tailwindcss/postcss` plugin

### Radix UI ✅
- **Status:** Implemented (via shadcn/ui)
- **Purpose:** Accessible, unstyled UI component primitives
- **Components Used:**
  - **Dialog** ✅ - Modal dialogs
  - **Select** ✅ - Select dropdowns (`@radix-ui/react-select`)
  - **Slot** ✅ - Composition utility (`@radix-ui/react-slot`)
  - Accordion, Avatar, Dropdown Menu, Label, Separator
- **Style:** New York variant (shadcn/ui)
- **Configuration:** `components.json`

### Lucide React ✅
- **Status:** Implemented (currently 0.400.0)
- **Purpose:** Icon library
- **Usage:** Consistent iconography throughout the application
- **Configuration:** Set as icon library in `components.json`

### Styling Utilities ✅
- **class-variance-authority** (0.7.1) - Component variant management
- **clsx** (2.1.1) - Conditional class names
- **tailwind-merge** (2.6.0) - Merge Tailwind classes intelligently

---

## Database & ORM

### Supabase (PostgreSQL) ✅
- **Status:** Implemented
- **Purpose:** Managed PostgreSQL database
- **Features:**
  - PostgreSQL 15+
  - Automated backups
  - Point-in-time recovery
  - Connection pooling
  - Database extensions support

### Prisma 6.2.1 ❌
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Type-safe database ORM
- **Why:** 
  - Type-safe database queries
  - Database schema as code
  - Auto-generated TypeScript types
  - Migration management
  - Better developer experience
- **Planned Implementation:**
  - Install Prisma: `npm install prisma @prisma/client@6.2.1`
  - Initialize: `npx prisma init`
  - Generate schema from existing Supabase tables
  - Replace direct Supabase queries with Prisma client
  - Configure Prisma with Supabase connection string

### Row-Level Security (RLS) ✅
- **Status:** Implemented
- **Purpose:** Database-level access control
- **Implementation:** 
  - RLS policies in `supabase/migrations/002_rls_policies.sql`
  - Policies for all tables (profiles, appointments, prescriptions, etc.)
  - Role-based access (patients, doctors, admins)
  - Multi-tenant data isolation ⚠️ (needs enhancement)

---

## Authentication & Backend

### Supabase Auth ✅
- **Status:** Implemented
- **Packages:**
  - `@supabase/supabase-js` (2.39.0) - Supabase client
  - `@supabase/ssr` (0.1.0) - Server-side rendering helpers
- **Features:**
  - User authentication
  - Session management
  - JWT token handling
  - Profile creation on sign-up

### Google OAuth ⚠️
- **Status:** Partially Implemented (via Supabase, target: googleapis)
- **Current:** Using Supabase's built-in Google OAuth provider
- **Target:** Direct integration with `googleapis` package
- **Planned Implementation:**
  - Install: `npm install googleapis`
  - Configure Google OAuth 2.0 credentials
  - Custom OAuth flow with more control
  - Enhanced user data retrieval
  - Custom token handling

### HttpOnly Cookie-Based Sessions ⚠️
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Enhanced security for session management
- **Current:** JWT tokens stored in localStorage/client
- **Planned Implementation:**
  - Store session tokens in HttpOnly cookies
  - Implement secure cookie middleware
  - CSRF token generation and validation
  - Session refresh mechanism
  - Secure cookie flags (Secure, SameSite, HttpOnly)

---

## Integrations

### Paystack ⚠️
- **Status:** Partially Implemented (direct API calls, target: paystack-js)
- **Current:** Direct Paystack API calls via fetch
- **Target:** `paystack-js` SDK
- **Planned Implementation:**
  - Install: `npm install paystack-js`
  - Replace direct API calls with SDK
  - Type-safe payment operations
  - Better error handling
- **Features:**
  - Payment initialization
  - Payment verification
  - Webhook handling
  - Transaction management

### Daily.co (@daily-co/daily-js) ✅
- **Status:** Implemented (0.78.0)
- **Purpose:** HIPAA-compliant video consultations
- **Features:**
  - Video room creation
  - Secure token generation
  - Video/audio streaming
  - Room management API
- **Usage:**
  - API routes: `/api/daily/create-room`, `/api/daily/get-token`
  - Client: `lib/daily/client.ts`
  - Component: `components/video/call-interface.tsx`

---

## Real-time & Data

### Server-Sent Events (SSE) ❌
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Real-time updates without WebSocket overhead
- **Current:** Using Supabase Realtime (WebSockets)
- **Planned Implementation:**
  - Create SSE endpoint: `/api/events`
  - Implement event streaming for:
    - Appointment updates
    - Notification delivery
    - Message notifications
  - Client-side EventSource connections
  - Connection management and reconnection logic
- **Why SSE over WebSockets:**
  - Simpler implementation
  - Built-in reconnection
  - HTTP/2 multiplexing support
  - Lower overhead for one-way updates

### React Big Calendar ⚠️
- **Status:** Installed (1.8.3) but not implemented
- **Purpose:** Calendar UI for scheduling
- **Planned Usage:**
  - Doctor availability calendar
  - Appointment scheduling view
  - Patient appointment calendar
  - Monthly/weekly/daily views

### Date Handling ⚠️
- **Status:** Using date-fns, target: Day.js & Moment.js
- **Current:** `date-fns` (3.0.6)
- **Target:** 
  - `dayjs` - Lightweight date library
  - `moment` - Feature-rich date library (for complex operations)
- **Planned Migration:**
  - Install: `npm install dayjs moment`
  - Replace date-fns imports
  - Configure dayjs plugins
  - Use Moment.js for complex timezone/formatting needs

---

## Development Tools

### ESLint ✅
- **Status:** Implemented
- **Configuration:** 
  - `eslint.config.mjs`
  - `eslint-config-next` (16.1.1) - Next.js recommended rules
  - TypeScript-aware linting

### TypeScript (Strict Mode) ✅
- **Status:** Implemented
- **Configuration:** `tsconfig.json`
  - Strict mode: ✅ Enabled
  - No implicit any
  - Strict null checks
  - Strict function types

### Netlify CLI ⚠️
- **Status:** Configuration exists, CLI for deployment
- **Purpose:** Deployment and serverless function management
- **Usage:**
  - `netlify deploy` - Deploy to preview
  - `netlify deploy --prod` - Production deployment
  - `netlify dev` - Local development with Netlify Functions
  - `netlify functions:invoke` - Test serverless functions

### PostCSS (Tailwind) ✅
- **Status:** Implemented
- **Configuration:** `postcss.config.mjs`
  - `@tailwindcss/postcss` plugin
  - Automatic CSS processing

---

## Deployment

### Netlify (Serverless Functions) ✅
- **Status:** Implemented
- **Configuration:** `netlify.toml`
- **Features:**
  - Automatic deployments from Git
  - Serverless functions in `netlify/functions/`
  - Environment variable management
  - Headers and security configurations
  - Redirects and rewrites
- **Build Settings:**
  - Node version: 20
  - Build command: `npm run build`
  - Publish directory: `.next`
  - Functions directory: `netlify/functions`

---

## Security Features

### Content Security Policy (CSP) ❌
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Prevent XSS attacks
- **Planned Implementation:**
  - Configure CSP headers in `next.config.ts` or middleware
  - Allow-list trusted sources (Supabase, Daily.co, Paystack)
  - Nonce-based script execution
  - Report-only mode for testing

### X-Frame-Options ⚠️
- **Status:** Partially Implemented (Netlify config)
- **Current:** Set in `netlify.toml` headers
- **Target:** Ensure `DENY` or `SAMEORIGIN` in all responses
- **Implementation:** ✅ Set to `DENY` in Netlify headers

### CSRF Protection ❌
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Prevent Cross-Site Request Forgery attacks
- **Planned Implementation:**
  - Generate CSRF tokens for state-changing operations
  - Validate tokens in API routes and Server Actions
  - Token rotation on each request
  - Cookie-based token storage (HttpOnly)
- **Packages Needed:**
  - Custom middleware or `csrf` package

### Rate Limiting ❌
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Prevent abuse and DDoS attacks
- **Planned Implementation:**
  - API route rate limiting
  - Per-user rate limits
  - Per-IP rate limits
  - Different limits for authenticated vs. unauthenticated users
- **Packages Needed:**
  - `@upstash/ratelimit` or `rate-limiter-flexible`
  - Redis for distributed rate limiting

### Audit Logging ⚠️
- **Status:** Partially Implemented
- **Current:** `audit_logs` table exists (`supabase/migrations/004_audit_logging.sql`)
- **Target:** Comprehensive audit logging for all PHI access
- **Enhancement Needed:**
  - Log all database queries accessing PHI
  - Log authentication events
  - Log data access (appointments, notes, prescriptions)
  - Log admin actions
  - Automated compliance reporting

---

## Architecture Patterns

### Server Components & Client Components ✅
- **Status:** Implemented
- **Pattern:**
  - Server Components (default) - Data fetching, static content
  - Client Components (`'use client'`) - Interactivity, hooks, browser APIs
  - Optimal component composition

### Server Actions ❌
- **Status:** Not Implemented (Target Stack)
- **Purpose:** Type-safe server-side mutations
- **Benefits:**
  - No API routes needed for simple mutations
  - Automatic revalidation
  - Progressive enhancement
  - Type safety end-to-end
- **Planned Usage:**
  - Form submissions
  - Appointment booking
  - Profile updates
  - Appointment status changes
  - SOAP notes creation

### Context-Aware Supabase Clients ⚠️
- **Status:** Partially Implemented
- **Current:** 
  - `lib/supabase/client.ts` - Client-side
  - `lib/supabase/server.ts` - Server-side
  - `lib/supabase/middleware.ts` - Middleware
- **Enhancement Needed:**
  - Context-based client selection
  - Automatic role injection
  - Tenant-aware queries
  - Optimized client reuse

### Multi-Tenant Architecture ⚠️
- **Status:** Partially Implemented (RLS policies exist)
- **Current:** Basic RLS policies for data isolation
- **Target:** Full multi-tenant support
- **Enhancement Needed:**
  - Tenant ID in all queries
  - Automatic tenant context injection
  - Cross-tenant data isolation
  - Tenant-specific configurations
  - Tenant onboarding workflow

### Role-Based Access Control (RBAC) ✅
- **Status:** Implemented
- **Implementation:**
  - Roles: `patient`, `doctor`, `admin`
  - Role stored in `profiles.role`
  - RLS policies enforce role-based access
  - Route-level protection via middleware
  - UI adaptation based on role
- **Enhancement Needed:**
  - Permission system (fine-grained)
  - Role hierarchies
  - Dynamic permission assignment

---

## Package Versions (Target Stack)

### Core Framework
```json
{
  "next": "^16.0.0",
  "react": "^19.2.1",
  "react-dom": "^19.2.1",
  "typescript": "^5.9.0"
}
```

### Database & ORM
```json
{
  "@prisma/client": "^6.2.1",
  "prisma": "^6.2.1",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.1.0"
}
```

### Styling
```json
{
  "tailwindcss": "^4.0.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-select": "^2.2.0",
  "@radix-ui/react-slot": "^1.2.0",
  "lucide-react": "^0.400.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0"
}
```

### Integrations
```json
{
  "paystack-js": "^1.0.0",
  "@daily-co/daily-js": "^0.78.0",
  "googleapis": "^130.0.0"
}
```

### Date Handling
```json
{
  "dayjs": "^1.11.10",
  "moment": "^2.30.1"
}
```

### Calendar & Real-time
```json
{
  "react-big-calendar": "^1.8.3"
}
```

### Development
```json
{
  "netlify-cli": "^17.0.0",
  "eslint": "^9.0.0",
  "eslint-config-next": "^16.0.0"
}
```

---

## Migration Roadmap

### Phase 1: Core ORM & Type Safety (Week 1)
**Goal:** Implement Prisma for type-safe database access

1. **Install Prisma**
   ```bash
   npm install prisma @prisma/client@6.2.1
   npx prisma init
   ```

2. **Generate Prisma Schema**
   - Create `prisma/schema.prisma`
   - Map existing Supabase tables
   - Define relationships and indexes

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Create Prisma Service**
   - Create `lib/prisma/client.ts` with singleton pattern
   - Handle connection pooling

5. **Migrate Queries**
   - Replace Supabase queries with Prisma
   - Start with read operations
   - Then write operations

---

### Phase 2: Authentication & Security (Week 2)
**Goal:** Enhanced authentication and security features

1. **Google OAuth with googleapis**
   - Install `googleapis`
   - Configure OAuth 2.0 flow
   - Implement custom OAuth handlers

2. **HttpOnly Cookie Sessions**
   - Implement cookie-based session storage
   - Create session middleware
   - Migrate from localStorage tokens

3. **CSRF Protection**
   - Implement CSRF token generation
   - Add validation middleware
   - Protect all mutations

4. **Rate Limiting**
   - Set up Redis (Upstash or local)
   - Implement rate limiter
   - Apply to API routes

---

### Phase 3: Real-time & Date Handling (Week 3)
**Goal:** Implement SSE and migrate date libraries

1. **Server-Sent Events**
   - Create SSE endpoint
   - Implement event streaming
   - Client-side EventSource hooks

2. **Migrate Date Libraries**
   - Install Day.js and Moment.js
   - Replace date-fns imports
   - Configure Day.js plugins

3. **React Big Calendar**
   - Implement calendar components
   - Doctor availability view
   - Appointment scheduling UI

---

### Phase 4: Server Actions & Architecture (Week 4)
**Goal:** Implement Server Actions and enhance architecture

1. **Server Actions**
   - Convert API routes to Server Actions
   - Form submissions
   - Mutations (appointments, notes, prescriptions)

2. **Context-Aware Clients**
   - Enhance Supabase client factory
   - Automatic role injection
   - Tenant context

3. **Multi-Tenant Enhancements**
   - Tenant ID in all queries
   - Tenant isolation checks
   - Tenant-specific features

---

### Phase 5: Security Hardening (Week 5)
**Goal:** Complete security implementation

1. **Content Security Policy**
   - Configure CSP headers
   - Test with report-only mode
   - Deploy to production

2. **Enhanced Audit Logging**
   - Implement comprehensive logging
   - PHI access tracking
   - Compliance reporting

3. **Security Headers**
   - Verify all headers
   - HSTS, X-Content-Type-Options
   - Permissions-Policy

---

## Implementation Status Summary

### ✅ Fully Implemented
- Next.js 16 (App Router)
- TypeScript 5.9 (Strict mode)
- React 19.2.x
- Tailwind CSS 4
- Radix UI (Dialog, Select, Slot)
- Lucide React
- Styling utilities (CVA, clsx)
- Supabase (PostgreSQL)
- Row-Level Security (RLS)
- Supabase Auth
- Daily.co integration
- Netlify deployment
- ESLint & TypeScript
- PostCSS
- X-Frame-Options
- Basic audit logging

### ⚠️ Partially Implemented (Needs Enhancement)
- Google OAuth (via Supabase, needs googleapis)
- Paystack (direct API, needs paystack-js)
- Context-aware Supabase clients (basic, needs enhancement)
- Multi-tenant architecture (RLS exists, needs full implementation)
- React Big Calendar (installed, not used)
- Audit logging (table exists, needs comprehensive implementation)

### ❌ Not Implemented (Target Stack)
- Prisma 6.2.1 ORM
- HttpOnly cookie-based sessions
- Server-Sent Events (SSE)
- Day.js & Moment.js
- Server Actions
- Content Security Policy (CSP)
- CSRF protection
- Rate limiting
- Full multi-tenant support

---

## Environment Variables (Target Stack)

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  # For migrations

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth (googleapis)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# Daily.co
DAILY_CO_API_KEY=
NEXT_PUBLIC_DAILY_CO_API_KEY=

# Session & Security
SESSION_SECRET=
CSRF_SECRET=

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React 19   │  │  Tailwind    │  │  Radix UI    │      │
│  │   Components │  │   CSS 4      │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Zustand     │  │  React Query │  │  EventSource │      │
│  │  (State)     │  │  (Server)    │  │  (SSE)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Next.js 16 (App Router)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Server     │  │   Server     │  │   API        │      │
│  │  Components  │  │   Actions    │  │   Routes     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Middleware  │  │  SSE Stream  │  │  Auth        │      │
│  │  (Auth/CSRF) │  │  Handler     │  │  Handler     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────┬─────────────────┬─────────────────┬──────────────┘
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   Prisma    │   │  Supabase   │   │  Google     │
    │    6.2.1    │   │   Auth      │   │  OAuth      │
    └──────┬──────┘   └─────────────┘   └─────────────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │        Supabase PostgreSQL                  │
    │  ┌────────────┐  ┌────────────┐            │
    │  │   RLS      │  │  Multi-    │            │
    │  │  Policies  │  │  Tenant    │            │
    │  └────────────┘  └────────────┘            │
    └─────────────────────────────────────────────┘
           │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   Paystack  │   │  Daily.co   │   │   Brevo/    │
    │  (paystack- │   │   (video)   │   │   Twilio    │
    │    -js)     │   │             │   │  (notify)   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Resources & Documentation

### Core Framework
- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [TypeScript 5.9 Docs](https://www.typescriptlang.org/docs)

### Database & ORM
- [Prisma 6.2 Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

### UI & Styling
- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs)
- [Lucide Icons](https://lucide.dev)

### Integrations
- [Paystack JS SDK](https://paystack.com/docs/api)
- [Daily.co Docs](https://docs.daily.co)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)

### Security
- [OWASP Security Cheat Sheets](https://cheatsheetseries.owasp.org)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Document Status:** Active - Migration in Progress  
**Last Updated:** January 2025  
**Next Review:** After Phase 1 completion  
**Maintained By:** Development Team
