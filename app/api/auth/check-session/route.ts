import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return NextResponse.json({
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: error?.message,
  })
}
