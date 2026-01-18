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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:16',message:'Dashboard layout auth check',data:{hasUser:!!user,userId:user?.id,authError:authError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H8'})}).catch(()=>{});
    // #endregion
    
    if (authError) {
      console.error('Auth error in dashboard layout:', authError.message)
    }

    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:22',message:'Dashboard layout redirecting - no user',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H8'})}).catch(()=>{});
      // #endregion
      console.log('Invalid session in dashboard layout, redirecting to sign-in')
      redirect('/auth/signin')
    }
    
    // Get user profile (this will use the validated session)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', user.id)
      .single()

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:28',message:'Dashboard layout profile fetch',data:{hasProfile:!!profile,profileError:profileError?.message,role:profile?.role,profileCompleted:profile?.profile_completed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H8'})}).catch(()=>{});
    // #endregion

    if (profileError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:34',message:'Dashboard layout redirecting - profile error',data:{profileError:profileError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H8'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching profile:', profileError)
      redirect('/complete-profile')
    }

    // Check profile completion
    if (!profile?.profile_completed) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/layout.tsx:40',message:'Dashboard layout redirecting - profile incomplete',data:{profileCompleted:profile?.profile_completed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H8'})}).catch(()=>{});
      // #endregion
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
    redirect('/auth/signin')
  }
}

