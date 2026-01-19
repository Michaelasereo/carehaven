import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, Calendar, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Auth and role checks are handled by app/(dashboard)/layout.tsx
  const supabase = await createClient()
  
  // Get current user profile for role-based UI (e.g., verify button visibility)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const { data: currentProfile } = currentUser ? await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single() : { data: null }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-gray-600">User not found</p>
          <Link href="/admin/patients">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Fetch user's appointments count
  const { count: appointmentsCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq(profile.role === 'patient' ? 'patient_id' : 'doctor_id', params.id)

  // Fetch recent appointments
  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      ${profile.role === 'patient' 
        ? 'doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)'
        : 'profiles!appointments_patient_id_fkey(full_name)'}
    `)
    .eq(profile.role === 'patient' ? 'patient_id' : 'doctor_id', params.id)
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const initials = profile.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={profile.role === 'patient' ? '/admin/patients' : '/admin/doctors'}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Account Details</h1>
          <p className="text-gray-600 mt-1">View and manage user account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{profile.full_name || 'Unknown User'}</h2>
                  <Badge variant={profile.role === 'doctor' && profile.license_verified ? 'default' : 'secondary'}>
                    {profile.role === 'doctor' && profile.license_verified ? 'Verified Doctor' : profile.role}
                  </Badge>
                  {profile.profile_completed ? (
                    <Badge variant="default">Profile Complete</Badge>
                  ) : (
                    <Badge variant="secondary">Profile Incomplete</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email || 'N/A'}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined: {profile.created_at ? format(new Date(profile.created_at), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                  {profile.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        DOB: {format(new Date(profile.date_of_birth), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {profile.gender && (
                    <span>Gender: {profile.gender}</span>
                  )}
                </div>

                {profile.role === 'doctor' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                    <h3 className="font-semibold text-gray-900">Professional Information</h3>
                    {profile.specialty && <p className="text-sm text-gray-600">Specialty: {profile.specialty}</p>}
                    {profile.license_number && (
                      <p className="text-sm text-gray-600">License: {profile.license_number}</p>
                    )}
                    {profile.years_experience && (
                      <p className="text-sm text-gray-600">Experience: {profile.years_experience} years</p>
                    )}
                    {profile.consultation_fee && (
                      <p className="text-sm text-gray-600">
                        Consultation Fee: ₦{Number(profile.consultation_fee).toLocaleString()}
                      </p>
                    )}
                    {profile.bio && (
                      <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Recent Appointments */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Appointments ({appointmentsCount || 0} total)</h3>
            {recentAppointments && recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.map((apt: any) => (
                  <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {profile.role === 'patient' 
                            ? apt.doctor?.full_name || 'Unknown Doctor'
                            : apt.profiles?.full_name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(apt.scheduled_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No appointments found</p>
            )}
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Actions
            </h3>
            <div className="space-y-2">
              {profile.role === 'doctor' && !profile.license_verified && currentProfile?.role === 'super_admin' && (
                <Link href={`/admin/doctors?verify=${params.id}`}>
                  <Button variant="default" className="w-full">
                    Verify License
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="w-full" disabled>
                Suspend Account
              </Button>
              <Button variant="destructive" className="w-full" disabled>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Account Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email Verified:</span>
                <Badge variant={profile.email_verified ? 'default' : 'secondary'}>
                  {profile.email_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
              {profile.role === 'doctor' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">License Verified:</span>
                  <Badge variant={profile.license_verified ? 'default' : 'secondary'}>
                    {profile.license_verified ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
