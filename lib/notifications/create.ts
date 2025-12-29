import { createClient } from '@supabase/supabase-js'

// This should only be used server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function createNotification(
  userId: string,
  type: 'appointment' | 'prescription' | 'investigation' | 'message' | 'system',
  title: string,
  body?: string,
  data?: any
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data,
    })

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

