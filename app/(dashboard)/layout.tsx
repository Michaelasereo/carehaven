import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DoctorSidebar } from '@/components/dashboard/doctor-sidebar'
import { AdminSidebar } from '@/components/dashboard/admin-sidebar'
import { Header } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    
    // Validate session server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error in dashboard layout:', authError.message)
    }

    if (!user) {
      console.log('Invalid session in dashboard layout, redirecting to sign-in')
      redirect('/auth/signin')
    }
    
    // Get user profile (this will use the validated session)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      redirect('/complete-profile')
    }

    // Check profile completion
    if (!profile?.profile_completed) {
      redirect('/complete-profile')
    }

    const isDoctor = profile?.role === 'doctor'
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    return (
      <div className="flex h-screen">
        {isAdmin ? <AdminSidebar /> : isDoctor ? <DoctorSidebar /> : <Sidebar />}
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-white p-6">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard layout error:', error)
    // Try to determine if this is an admin route for better redirect
    redirect('/auth/signin')
  }
}

