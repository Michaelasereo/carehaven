import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminSettingsPage() {
  // Auth and role checks are handled by app/(dashboard)/layout.tsx
  // Redirect to system settings as default
  redirect('/admin/settings/system')
}
