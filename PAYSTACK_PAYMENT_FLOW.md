# Paystack Payment Flow Documentation

## Overview
This document outlines the complete Paystack payment integration and redirect flow for appointment bookings.

## Payment Flow Architecture

```
1. User completes booking form
   ↓
2. Appointment created in database
   ↓
3. Payment initialized via /api/payments/initialize
   ↓
4. User redirected to Paystack payment page
   ↓
5. User completes payment on Paystack
   ↓
6. Paystack redirects to /payment/callback
   ↓
7. Callback verifies payment and redirects to /patient/appointments
```

## Key Files

### 1. Payment Initialization
**File:** `lib/paystack/client.ts`

```typescript
export async function initializePayment(amount: number, email: string, reference: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carehaven.app'
  const callbackUrl = `${appUrl}/payment/callback`
  
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountKobo,
      email,
      reference,
      callback_url: callbackUrl,
    }),
  })
  
  return responseData // Contains authorization_url
}
```

**Key Points:**
- Amount is in kobo (e.g., 5000 = ₦50)
- Callback URL: `${NEXT_PUBLIC_APP_URL}/payment/callback`
- Returns `authorization_url` for redirect

---

### 2. Payment Initialization API Route
**File:** `app/api/payments/initialize/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  
  // 2. Validate request body (amount, appointmentId)
  
  // 3. Get user email from profile
  const recipientEmail = profile?.email ?? user.email
  
  // 4. Generate reference: `appt_${appointmentId}_${Date.now()}`
  const reference = `appt_${appointmentId}_${Date.now()}`
  
  // 5. Initialize payment with Paystack
  const payment = await initializePayment(amount, recipientEmail, reference)
  
  // 6. Save reference to appointment
  await supabase
    .from('appointments')
    .update({ paystack_reference: reference })
    .eq('id', appointmentId)
  
  // 7. Return authorization_url
  return NextResponse.json({ authorization_url: payment.data!.authorization_url })
}
```

---

### 3. Booking Form Payment Trigger
**File:** `components/patient/book-appointment-form.tsx`

**Relevant Code:**
```typescript
// After appointment is created
const paymentResponse = await fetch('/api/payments/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: appointmentAmount, // in kobo
    appointmentId,
  }),
})

const paymentData = await paymentResponse.json()
if (paymentData.authorization_url) {
  // Redirect to Paystack
  window.location.href = paymentData.authorization_url
}
```

---

### 4. Payment Callback Handler (CURRENT ISSUE)
**File:** `app/payment/callback/route.ts`

**Current Implementation:**
```typescript
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin  // e.g., "https://carehaven.app"
  const reference = searchParams.get('reference')
  const error = searchParams.get('error')

  // Handle errors
  if (error || !reference) {
    return NextResponse.redirect(
      new URL('/patient/appointments?error=payment_failed', origin)
    )
  }

  try {
    // 1. Verify payment with Paystack
    const payment = await verifyPayment(reference)

    // 2. Find appointment by reference
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('paystack_reference', reference)
      .single()

    // 3. Idempotency check
    if (appointment.payment_status === 'paid' && appointment.status === 'confirmed') {
      return NextResponse.redirect(
        new URL(`/patient/appointments?success=payment_complete&appointment_id=${appointment.id}`, origin)
      )
    }

    // 4. Validate amount
    const paymentAmount = payment.data.amount // kobo
    const appointmentAmount = Math.round((Number(appointment.amount) || 0) * 100) // kobo

    // 5. Update appointment status
    await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', appointment.id)

    // 6. Create video room, notifications, emails...

    // 7. Redirect to appointments page
    return NextResponse.redirect(
      new URL(`/patient/appointments?success=payment_complete&appointment_id=${appointment.id}`, origin)
    )
  } catch (error) {
    return NextResponse.redirect(
      new URL('/patient/appointments?error=verification_failed', origin)
    )
  }
}
```

**Current Issue:**
- Browser gets stuck in redirect loop
- Using `origin` from `request.url` for redirect base
- All redirects go to `/patient/appointments` with query parameters

---

### 5. Payment Verification
**File:** `lib/paystack/client.ts`

```typescript
export async function verifyPayment(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  })
  
  return response.json()
}
```

---

### 6. Webhook Handler (Primary Verification)
**File:** `app/api/payments/webhook/route.ts`

**Purpose:** Paystack sends webhook events for payment confirmations. This is the authoritative source.

**Key Features:**
- Verifies Paystack signature using HMAC SHA512
- Processes `charge.success` events
- Updates appointment status
- Creates video rooms and notifications
- Idempotent (can be called multiple times safely)

---

## Redirect URL Construction Issue

### Current Problem
The browser gets stuck in a redirect loop when Paystack redirects back to `/payment/callback`.

### Current Implementation
```typescript
const requestUrl = new URL(request.url)
const origin = requestUrl.origin  // e.g., "https://carehaven.app"
return NextResponse.redirect(
  new URL('/patient/appointments?success=payment_complete&appointment_id=${id}', origin)
)
```

### Previous Working Implementation (Commit 58ef62f)
```typescript
return NextResponse.redirect(
  new URL('/patient/appointments?success=payment_complete&appointment_id=${id}', request.url)
)
```

**Note:** The working version used `request.url` directly, not `request.url.origin`.

---

## Environment Variables Required

```env
PAYSTACK_SECRET_KEY=sk_live_xxxxx  # or sk_test_xxxxx for testing
NEXT_PUBLIC_APP_URL=https://carehaven.app  # Used for callback URL
```

---

## Redirect Flow Details

1. **Paystack redirects to:** `https://carehaven.app/payment/callback?reference=appt_xxx_1234567890`
2. **Callback handler processes payment**
3. **Callback redirects to:** `https://carehaven.app/patient/appointments?success=payment_complete&appointment_id=xxx`
4. **Issue:** Browser gets stuck, possibly due to:
   - URL construction using `origin` instead of full `request.url`
   - Middleware interference
   - Redirect loop between callback and appointments page

---

## Testing the Redirect

To debug the redirect issue:

1. Check browser Network tab for redirect chain
2. Check server logs for redirect URLs being generated
3. Verify `origin` value is correct
4. Test with absolute URL string instead of URL object

---

## Related Files Summary

| File | Purpose |
|------|---------|
| `lib/paystack/client.ts` | Paystack API client (initialize, verify) |
| `app/api/payments/initialize/route.ts` | Initialize payment API route |
| `app/payment/callback/route.ts` | **Payment callback handler (redirect issue here)** |
| `app/api/payments/webhook/route.ts` | Paystack webhook handler (primary verification) |
| `components/patient/book-appointment-form.tsx` | Booking form that triggers payment |

---

## Next Steps to Fix Redirect

1. Try using absolute URL string: `NextResponse.redirect('https://carehaven.app/patient/appointments?...')`
2. Check if middleware is interfering with redirects
3. Add logging to see what URL is being constructed
4. Consider using `getBaseUrl()` utility (already exists in `lib/utils/url.ts`)
