import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VerifyDoctorButton } from '@/components/admin/verify-doctor-button'
import { format } from 'date-fns'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  FileText, 
  Stethoscope,
  TrendingUp 
} from 'lucide-react'
import Link from 'next/link'

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Auth and role checks are handled by app/(dashboard)/layout.tsx
  const supabase = await createClient()
  
  // Get current user profile for role-based UI (e.g., verify button visibility)
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() : { data: null }

  // Fetch doctor details
  const { data: doctor, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'doctor')
    .single()

  if (error || !doctor) {
    notFound()
  }

  // Fetch aggregated statistics
  const [
    { count: totalAppointments },
    { count: completedAppointments },
    { count: cancelledAppointments },
    { count: uniquePatients },
    { data: appointments },
    { data: paidAppointments },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', id),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', id)
      .eq('status', 'completed'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', id)
      .eq('status', 'cancelled'),
    supabase
      .from('appointments')
      .select('patient_id', { count: 'exact', head: true })
      .eq('doctor_id', id),
    supabase
      .from('appointments')
      .select('*, profiles!appointments_patient_id_fkey(full_name, email)')
      .eq('doctor_id', id)
      .order('scheduled_at', { ascending: false })
      .limit(20),
    supabase
      .from('appointments')
      .select('amount, scheduled_at')
      .eq('doctor_id', id)
      .eq('payment_status', 'paid'),
  ])

  const totalRevenue = paidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0
  const completionRate = totalAppointments && totalAppointments > 0
    ? Math.round((completedAppointments || 0) / totalAppointments * 100)
    : 0
  const cancellationRate = totalAppointments && totalAppointments > 0
    ? Math.round((cancelledAppointments || 0) / totalAppointments * 100)
    : 0

  // Calculate monthly revenue
  const monthlyRevenue = paidAppointments
    ?.filter(apt => {
      const aptDate = new Date(apt.scheduled_at)
      const now = new Date()
      return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

  const initials = doctor.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'DR'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/doctors">
            <Button variant="outline" size="sm">← Back to Doctors</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Details</h1>
            <p className="text-gray-600 mt-1">View and manage doctor profile</p>
          </div>
        </div>
        {profile?.role === 'super_admin' && (
          <VerifyDoctorButton 
            doctorId={doctor.id} 
            currentVerificationStatus={doctor.license_verified || false}
          />
        )}
      </div>

      {/* Profile Overview */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={doctor.avatar_url || undefined} alt={doctor.full_name || 'Doctor'} />
            <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">{doctor.full_name || 'Unknown'}</h2>
              <Badge variant={doctor.license_verified ? 'default' : 'secondary'}>
                {doctor.license_verified ? 'Verified' : 'Access Revoked'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{doctor.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Specialty</p>
                <p className="font-medium">{doctor.specialty || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">License Number</p>
                <p className="font-medium">{doctor.license_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-medium">{doctor.years_experience || 0} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Consultation Fee</p>
                <p className="font-medium">₦{Number(doctor.consultation_fee || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registered</p>
                <p className="font-medium">{format(new Date(doctor.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            {doctor.bio && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-1">Bio</p>
                <p className="text-gray-900">{doctor.bio}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold mt-2">{totalAppointments || 0}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold mt-2">{uniquePatients || 0}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">₦{Math.round(totalRevenue / 100).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">This month: ₦{Math.round(monthlyRevenue / 100).toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold mt-2">{completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Cancellation: {cancellationRate}%</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for Detailed Views */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Appointments</h3>
            <div className="space-y-3">
              {appointments && appointments.length > 0 ? (
                appointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {apt.profiles?.full_name || 'Patient'} - {apt.profiles?.email}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{format(new Date(apt.scheduled_at), 'MMM d, yyyy h:mm a')}</span>
                        <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                    <Link href={`/admin/appointments/${apt.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No appointments found</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Patient List</h3>
            <p className="text-gray-600">
              View all patients who have booked appointments with this doctor.
            </p>
            <Link href={`/admin/patients?doctor=${doctor.id}`}>
              <Button variant="outline" className="mt-4">
                View All Patients
              </Button>
            </Link>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Revenue</span>
                <span className="text-2xl font-bold">₦{Math.round(totalRevenue / 100).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">This Month</span>
                <span className="text-xl font-semibold">₦{Math.round(monthlyRevenue / 100).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Paid Appointments</span>
                <span className="text-xl font-semibold">{paidAppointments?.length || 0}</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
