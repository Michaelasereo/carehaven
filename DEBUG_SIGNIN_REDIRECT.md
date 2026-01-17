# Debugging Sign-In Redirect Issue

## Problem
After successful sign-in, user is not redirected to dashboard.

## Potential Causes

1. **Cookie Synchronization**: Client-side cookies not immediately available to server/middleware
2. **Middleware Timing**: Middleware runs before cookies are set
3. **Session Storage**: Supabase session stored in localStorage but not synced to HTTP cookies

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools → Console and look for:
- "Session verified: [user-id]"
- "Final redirect path: /patient" (or other dashboard)
- Any error messages

### 2. Check Network Tab
- Look for the redirect request to `/patient` (or dashboard route)
- Check the response status code
- Verify cookies are being sent in the request headers

### 3. Check Application Tab
- Go to DevTools → Application → Cookies
- Look for Supabase auth cookies (usually prefixed with `sb-`)
- Verify they exist and have correct domain/path

### 4. Test Session API
Open browser console and run:
```javascript
fetch('/api/auth/check-session').then(r => r.json()).then(console.log)
```
This should return `{ hasUser: true, userId: "..." }` if session is working.

### 5. Check Server Logs
Look for middleware logs:
- `[Middleware] { path: '/patient', hasUser: true/false, ... }`

## Quick Fixes to Try

### Fix 1: Increase Wait Time
In `components/auth/email-signin-form.tsx`, increase the wait time:
```typescript
// Change from 500ms to 1000ms
await new Promise(resolve => setTimeout(resolve, 1000))
```

### Fix 2: Use Callback Route
Instead of direct redirect, use the callback route:
```typescript
window.location.href = '/auth/callback'
```
The callback route will handle the redirect server-side.

### Fix 3: Verify Cookie Settings
Check if Supabase cookies need specific settings. The `@supabase/ssr` package should handle this automatically, but verify in `lib/supabase/client.ts`.

## Current Implementation

The sign-in flow:
1. User submits form
2. `signInWithPassword()` called
3. Session verified (waits 300ms)
4. Profile fetched
5. Redirect path determined
6. Final session check (waits 500ms)
7. Redirects via `window.location.href`

## Expected Behavior

1. User signs in successfully
2. Cookies are set by Supabase
3. Redirect to `/patient` (or role-based dashboard)
4. Middleware checks cookies
5. User sees dashboard

## If Still Not Working

1. **Check Supabase Dashboard**: Verify user exists and is active
2. **Check RLS Policies**: Ensure profiles table is accessible
3. **Check Environment Variables**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Clear Browser Data**: Try in incognito mode
5. **Check Middleware Logs**: Look for any errors in server console

## Alternative Solution

If cookies continue to be an issue, consider using a server action for redirect:

```typescript
// In a server action file
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function redirectAfterSignIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  // Get profile and redirect...
}
```

Then call this from the client after sign-in.
