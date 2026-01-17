# 🚨 Critical Bug Report: 500 Internal Server Error - Edge Runtime Issue

## 📋 Executive Summary

**Status:** 🔴 CRITICAL - All routes returning 500 errors  
**Impact:** Application completely non-functional in development  
**Production Status:** ✅ Working (deployed successfully to Netlify)  
**Root Cause:** Next.js 15 Edge Runtime `EvalError` in middleware compilation  
**Date:** December 30, 2024

---

## 🔍 Error Details

### Primary Error
```
EvalError: Code generation from strings disallowed for this context
```

### Error Location
```
/Users/macbook/Desktop/carehaven/.next/server/middleware.js:29
at (middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js
```

### Error Stack Trace
```
EvalError: Code generation from strings disallowed for this context
    at (middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js
    at __webpack_require__ (/Users/macbook/Desktop/carehaven/.next/server/edge-runtime-webpack.js:37:33)
    at __webpack_exec__ (/Users/macbook/Desktop/carehaven/.next/server/middleware.js:1109:48)
    at Script.runInContext (node:vm:149:12)
    at runInContext (node:vm:301:6)
    at evaluateInContext (/Users/macbook/Desktop/carehaven/node_modules/next/dist/server/web/sandbox/context.js:439:38)
    at getRuntimeContext (/Users/macbook/Desktop/carehaven/node_modules/next/dist/server/web/sandbox/sandbox.js:80:9)
```

---

## 🧪 Test Results

### Route Status
| Route | Status Code | Notes |
|-------|-------------|-------|
| `/` | 500 | Homepage fails |
| `/test` | 500 | Minimal test page fails |
| `/auth/signin` | 500 | Auth page fails |
| `/patient` | 500 | Dashboard fails |
| `/doctor` | 500 | Dashboard fails |
| `/api/debug/error` | ✅ 200 | **API routes work!** |

### Key Finding
- ✅ **API routes work** (200 status)
- ❌ **All page routes fail** (500 status)
- This indicates the issue is in **page rendering/layout**, not API routes

---

## 📁 Relevant Code Files

### 1. Middleware (Current State)

**File:** `middleware.ts` (Currently disabled as `middleware.ts.disabled`)

**Original Code:**
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Simplified Version (Still Fails):**
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
```

**Status:** Even minimal middleware causes the error.

---

### 2. Supabase Middleware Helper

**File:** `lib/supabase/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not set, skipping auth check')
      return supabaseResponse
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/') &&
      request.nextUrl.pathname !== '/'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('Error in updateSession:', error)
    return NextResponse.next({
      request,
    })
  }
}
```

**Issue:** Uses `@supabase/ssr` which may have Edge Runtime compatibility issues.

---

### 3. Root Layout

**File:** `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Care Haven - Telemedicine Platform",
  description: "Connect with licensed healthcare professionals via secure video consultations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

**Potential Issue:** ReactQueryProvider is a client component - should be fine, but worth checking.

---

### 4. React Query Provider

**File:** `lib/react-query/provider.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Status:** This is a client component, should not cause Edge Runtime issues.

---

### 5. Next.js Configuration

**File:** `next.config.ts` (Current)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.daily.co',
      },
    ],
  },
  
  // Ensure proper transpilation for Edge Runtime compatibility
  transpilePackages: [
    '@supabase/auth-helpers-nextjs',
    '@supabase/supabase-js',
    '@supabase/ssr',
    'lucide-react',
  ],
  
  // Experimental settings to avoid Edge Runtime issues
  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  // Logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

---

### 6. Package Versions

**File:** `package.json` (Relevant dependencies)

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.1.0",
    "@supabase/supabase-js": "^2.39.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

**Key Versions:**
- Next.js: `15.0.0` (latest)
- React: `19.0.0` (latest)
- Supabase SSR: `0.1.0`

---

## 🔬 Root Cause Analysis

### Hypothesis 1: Next.js 15 Edge Runtime Eval Restriction
**Likelihood:** 🔴 HIGH

Next.js 15 uses Edge Runtime for middleware by default. The Edge Runtime has strict security restrictions that prevent `eval()` and dynamic code generation. The webpack loader is trying to use `eval()` to compile the middleware, which is blocked.

**Evidence:**
- Error: `EvalError: Code generation from strings disallowed for this context`
- Error location: `next-middleware-loader.js` (webpack loader)
- Even minimal middleware fails

### Hypothesis 2: Supabase SSR Edge Runtime Incompatibility
**Likelihood:** 🟡 MEDIUM

The `@supabase/ssr` package may use Node.js-specific APIs that aren't available in Edge Runtime.

**Evidence:**
- Error occurs when middleware imports Supabase
- But error persists even without Supabase imports

### Hypothesis 3: Next.js 15 + React 19 Compatibility
**Likelihood:** 🟡 MEDIUM

React 19 is very new and may have compatibility issues with Next.js 15's Edge Runtime.

**Evidence:**
- Using bleeding-edge versions
- Production build works (different runtime)

---

## 🛠️ Attempted Fixes

### ✅ Fix 1: Simplified Middleware
- **Action:** Removed all Supabase imports, created minimal middleware
- **Result:** ❌ Still fails with same error

### ✅ Fix 2: Disabled Middleware
- **Action:** Renamed `middleware.ts` to `middleware.ts.disabled`
- **Result:** ❌ Pages still fail (error persists)

### ✅ Fix 3: Updated Next.js Config
- **Action:** Added transpilePackages and experimental settings
- **Result:** ❌ No change

### ✅ Fix 4: Cleared Build Cache
- **Action:** `rm -rf .next` multiple times
- **Result:** ❌ Error persists

### ✅ Fix 5: Test API Route
- **Action:** Created `/api/debug/error` route
- **Result:** ✅ **Works!** (200 status)

---

## 🎯 Key Observations

1. **API routes work** - This is critical! It means:
   - Next.js server is running
   - Environment variables are loaded
   - Basic routing works
   - The issue is **page-specific**

2. **Even minimal pages fail** - `/test` page with no dependencies fails, suggesting:
   - Issue is in layout or middleware compilation
   - Not a component-level issue

3. **Production works** - Deployed to Netlify successfully, which means:
   - Build process works
   - Code is valid
   - Issue is **development-specific**

4. **Error is in middleware compilation** - The error occurs during webpack compilation of middleware, not at runtime

---

## 🔧 Recommended Solutions

### Solution 1: Downgrade Next.js (Quick Fix)
```bash
npm install next@14.2.5
rm -rf .next node_modules
npm install
npm run dev
```

**Pros:** Fast, likely to work  
**Cons:** Loses Next.js 15 features

### Solution 2: Use Node.js Runtime for Middleware
**File:** `middleware.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force Node.js runtime instead of Edge
export const runtime = 'nodejs'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
```

**Note:** This may not work if Next.js 15 doesn't support Node.js runtime for middleware.

### Solution 3: Remove Middleware Entirely
- Move auth checks to individual route handlers
- Use server components for auth checks
- Use client-side redirects for protected routes

### Solution 4: Update to Latest Next.js
```bash
npm install next@latest
```

Check if there's a newer version that fixes this issue.

### Solution 5: Use Route Handlers for Auth
Instead of middleware, create a HOC or wrapper component:
```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return <>{children}</>
}
```

---

## 📊 Environment Details

### System
- **OS:** macOS 23.3.0 (darwin)
- **Node Version:** v22.13.1
- **Package Manager:** npm

### Development Server
- **Command:** `npm run dev`
- **Port:** 3000
- **Status:** Running but pages fail

### Production
- **Platform:** Netlify
- **URL:** https://carehaven.app
- **Status:** ✅ Working

---

## 🧪 Diagnostic Commands

### Check Next.js Version
```bash
npx next --version
```

### Check for Known Issues
```bash
npm ls next
```

### Test Minimal Middleware
```typescript
// middleware.ts - Absolute minimum
export function middleware() {
  return new Response('OK')
}
```

### Check Terminal Logs
```bash
# Look for these patterns in terminal:
# - "EvalError"
# - "Edge Runtime"
# - "middleware"
# - "webpack"
```

---

## 📝 Next Steps for Senior Developer

1. **Review Next.js 15 Release Notes**
   - Check for known Edge Runtime issues
   - Look for middleware-related breaking changes

2. **Check Supabase SSR Compatibility**
   - Verify `@supabase/ssr@0.1.0` works with Next.js 15
   - Check if newer version available

3. **Test with Different Runtimes**
   - Try forcing Node.js runtime
   - Test without middleware

4. **Review Production vs Development**
   - Why does production work but dev doesn't?
   - Check Netlify's Next.js runtime configuration

5. **Consider Alternative Auth Patterns**
   - Server Components auth checks
   - Route-level protection
   - Client-side auth state

---

## 🔗 Relevant Links

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime Limitations](https://nextjs.org/docs/app/api-reference/edge)

---

## 📞 Contact Information

**Issue Reported:** December 30, 2024  
**Severity:** Critical  
**Reproducible:** Yes (100% of page routes)  
**Workaround:** Use production build or API routes only

---

## 🎯 Quick Test Commands

```bash
# Test API route (should work)
curl http://localhost:3000/api/debug/error

# Test page route (will fail)
curl http://localhost:3000/test

# Check server logs
tail -f /tmp/next-dev-fixed.log

# Rebuild from scratch
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

