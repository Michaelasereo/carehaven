'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface VerifyDoctorButtonProps {
  doctorId: string
}

export function VerifyDoctorButton({ doctorId }: VerifyDoctorButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    // Fetch user role
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()
  }, [supabase])

  const handleVerify = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ license_verified: true })
        .eq('id', doctorId)

      if (error) throw error

      // Log verification action via API
      try {
        await fetch('/api/admin/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'verification',
            entityType: 'profile',
            entityId: doctorId,
            verified: true,
          }),
        })
      } catch (auditError) {
        console.error('Error logging verification:', auditError)
        // Don't fail the verification if audit logging fails
      }

      // Create notification for doctor
      try {
        await supabase.from('notifications').insert({
          user_id: doctorId,
          type: 'system',
          title: 'License Verified',
          body: 'Your medical license has been verified. You can now accept appointments.',
        })
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
      }

      router.refresh()
      setShowDialog(false)
    } catch (error) {
      console.error('Error verifying doctor:', error)
      addToast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Failed to verify doctor. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render button if user is not super_admin
  if (userRole !== 'super_admin') {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-teal-600 hover:bg-teal-700"
        size="sm"
      >
        <UserCheck className="h-4 w-4 mr-2" />
        Verify License
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Doctor License</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this doctor's license? This will allow them to accept appointments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
