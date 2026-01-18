import { createClient } from '@/lib/supabase/server'

export interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

/**
 * Get all FAQs ordered by display_order
 */
export async function getFAQs(): Promise<FAQ[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching FAQs:', error)
    return []
  }

  return (data || []) as FAQ[]
}

/**
 * Get active FAQs with optional limit
 * @param limit Optional limit on number of FAQs to return
 */
export async function getActiveFAQs(limit?: number): Promise<FAQ[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching active FAQs:', error)
    return []
  }

  return (data || []) as FAQ[]
}

/**
 * Create a new FAQ
 */
export async function createFAQ(
  question: string,
  answer: string,
  displayOrder: number,
  adminId: string
): Promise<{ success: boolean; data?: FAQ; error?: string }> {
  const supabase = await createClient()

  if (!question.trim() || !answer.trim()) {
    return { success: false, error: 'Question and answer are required' }
  }

  const { data, error } = await supabase
    .from('faqs')
    .insert({
      question: question.trim(),
      answer: answer.trim(),
      display_order: displayOrder,
      is_active: true,
      created_by: adminId,
      updated_by: adminId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating FAQ:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as FAQ }
}

/**
 * Update an existing FAQ
 */
export async function updateFAQ(
  id: string,
  updates: {
    question?: string
    answer?: string
    display_order?: number
    is_active?: boolean
  },
  adminId: string
): Promise<{ success: boolean; data?: FAQ; error?: string }> {
  const supabase = await createClient()

  if (updates.question !== undefined && !updates.question.trim()) {
    return { success: false, error: 'Question cannot be empty' }
  }

  if (updates.answer !== undefined && !updates.answer.trim()) {
    return { success: false, error: 'Answer cannot be empty' }
  }

  const updateData: any = {
    updated_by: adminId,
  }

  if (updates.question !== undefined) {
    updateData.question = updates.question.trim()
  }
  if (updates.answer !== undefined) {
    updateData.answer = updates.answer.trim()
  }
  if (updates.display_order !== undefined) {
    updateData.display_order = updates.display_order
  }
  if (updates.is_active !== undefined) {
    updateData.is_active = updates.is_active
  }

  const { data, error } = await supabase
    .from('faqs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating FAQ:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as FAQ }
}

/**
 * Delete an FAQ
 */
export async function deleteFAQ(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting FAQ:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Reorder FAQs by providing an array of FAQ IDs in the desired order
 */
export async function reorderFAQs(
  faqIds: string[],
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Update each FAQ with its new display_order
  const updates = faqIds.map((id, index) => ({
    id,
    display_order: index,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('faqs')
      .update({
        display_order: update.display_order,
        updated_by: adminId,
      })
      .eq('id', update.id)

    if (error) {
      console.error('Error reordering FAQs:', error)
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}
