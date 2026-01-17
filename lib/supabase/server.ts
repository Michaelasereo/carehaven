import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'default'
  const cookieName = `sb-${projectRef}-auth-token`

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle error if needed (e.g., in Server Components where cookies can't be set)
            if (process.env.NODE_ENV === 'development') {
              console.log('Cookie set error (may be expected in Server Components):', error)
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Cookie remove error (may be expected in Server Components):', error)
            }
          }
        },
      },
    }
  )
}

