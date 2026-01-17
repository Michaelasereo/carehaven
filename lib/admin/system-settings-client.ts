'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Client-side function to get consultation price with real-time support
 */
export async function getConsultationPriceClient(): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('consultation_price')
    .single()

  if (error || !data) {
    console.error('Error fetching consultation price:', error)
    // Return default price of 50 naira (5000 kobo) if error
    return 5000
  }

  return Number(data.consultation_price) || 5000
}
