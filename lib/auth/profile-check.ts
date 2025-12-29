import { createClient } from '@/lib/supabase/server'

export async function checkProfileCompletion(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_completed')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return data.profile_completed ?? false
}

export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data.role
}

