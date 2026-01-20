import { createClient } from '@/lib/supabase/server'
import { initializePayment } from '@/lib/paystack/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'Payment service is not configured. Please contact support.' 
      }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, appointmentId } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const reference = `appt_${appointmentId}_${Date.now()}`
    const payment = await initializePayment(amount, profile?.email || user.email!, reference)

    // Update appointment with payment reference
    await supabase
      .from('appointments')
      .update({ paystack_reference: reference })
      .eq('id', appointmentId)

    return NextResponse.json({ authorization_url: payment.data.authorization_url })
  } catch (error) {
    console.error('Error initializing payment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

