import { createClient } from '@/lib/supabase/server'
import { initializePayment } from '@/lib/paystack/client'
import { NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in and try again.' }, { status: 401 })
    }

    let body: { amount?: number; appointmentId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Please try again.' },
        { status: 400 }
      )
    }

    const { amount, appointmentId } = body
    if (typeof amount !== 'number' || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid or missing amount. Please refresh and try again.' },
        { status: 400 }
      )
    }
    if (typeof appointmentId !== 'string' || !UUID_REGEX.test(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid or missing appointment. Please go back and complete booking again.' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const recipientEmail = profile?.email ?? user.email ?? null
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No email on file. Please complete your profile with an email before paying.' },
        { status: 400 }
      )
    }

    const reference = `appt_${appointmentId}_${Date.now()}`
    const payment = await initializePayment(amount, recipientEmail, reference)

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ paystack_reference: reference })
      .eq('id', appointmentId)
      .eq('patient_id', user.id)

    if (updateError) {
      console.error('Error saving payment reference:', updateError)
      return NextResponse.json(
        { error: 'Payment link was created but we could not link it to your appointment. Please contact support with your appointment details.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ authorization_url: payment.data!.authorization_url })
  } catch (error) {
    console.error('Error initializing payment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

