import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/paystack/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { reference } = await request.json()
    const payment = await verifyPayment(reference)

    if (payment.data.status === 'success') {
      const supabase = await createClient()

      // Find appointment by reference
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('paystack_reference', reference)
        .single()

      if (appointment) {
        await supabase
          .from('appointments')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', appointment.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}

