import { createClient } from '@/lib/supabase/server'

export interface SystemSettings {
  id: string
  consultation_price: number
  consultation_duration: number
  currency: string
  updated_by?: string
  updated_at: string
}

/**
 * Get the current global consultation price
 * @returns The consultation price in kobo (e.g., 5000 = 50 naira)
 */
export async function getConsultationPrice(): Promise<number> {
  const supabase = await createClient()
  
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

/**
 * Get all system settings
 */
export async function getSystemSettings(): Promise<SystemSettings | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching system settings:', error)
    return null
  }

  return data as SystemSettings
}

/**
 * Get the current global consultation duration
 * @returns The consultation duration in minutes (default: 45)
 */
export async function getConsultationDuration(): Promise<number> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('consultation_duration')
    .single()

  if (error || !data) {
    console.error('Error fetching consultation duration:', error)
    // Return default duration of 45 minutes if error
    return 45
  }

  return Number(data.consultation_duration) || 45
}

/**
 * Update the global consultation duration (admin only)
 * @param duration The new consultation duration in minutes
 * @param adminId The ID of the admin making the update
 */
export async function updateConsultationDuration(
  duration: number,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate duration
  if (duration < 1) {
    return { success: false, error: 'Duration must be at least 1 minute' }
  }

  // Get settings id first
  const { data: settings } = await supabase
    .from('system_settings')
    .select('id')
    .single()

  if (!settings) {
    return { success: false, error: 'System settings not found' }
  }

  // Update duration
  const { error } = await supabase
    .from('system_settings')
    .update({
      consultation_duration: duration,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settings.id)

  if (error) {
    console.error('Error updating consultation duration:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update the global consultation price (admin only)
 * @param price The new consultation price in kobo
 * @param adminId The ID of the admin making the update
 */
export async function updateConsultationPrice(
  price: number,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate price
  if (price < 0) {
    return { success: false, error: 'Price cannot be negative' }
  }

  // Get settings id first
  const { data: settings } = await supabase
    .from('system_settings')
    .select('id')
    .single()

  if (!settings) {
    return { success: false, error: 'System settings not found' }
  }

  // Update price
  const { error } = await supabase
    .from('system_settings')
    .update({
      consultation_price: price,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settings.id)

  if (error) {
    console.error('Error updating consultation price:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
