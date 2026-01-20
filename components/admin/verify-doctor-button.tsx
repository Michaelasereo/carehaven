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
  currentVerificationStatus?: boolean
}

export function VerifyDoctorButton({ doctorId, currentVerificationStatus }: VerifyDoctorButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(currentVerificationStatus ?? false)
  const supabase = createClient()
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    // Fetch user role and doctor verification status
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

      // Fetch doctor verification status
      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('license_verified')
        .eq('id', doctorId)
        .single()
      
      if (doctorProfile) {
        setIsVerified(doctorProfile.license_verified || false)
      }
    }

    fetchUserRole()

    // Subscribe to verification status changes
    const channel = supabase
      .channel(`doctor-verification-${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${doctorId}`,
        },
        (payload) => {
          const newData = payload.new as any
          if (newData.license_verified !== undefined) {
            setIsVerified(newData.license_verified)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, doctorId])

  const handleToggleVerification = async () => {
    setIsLoading(true)
    const newVerificationStatus = !isVerified
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ license_verified: newVerificationStatus })
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
            verified: newVerificationStatus,
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
          title: newVerificationStatus ? 'Access Restored' : 'Access Revoked',
          body: newVerificationStatus 
            ? 'Your access has been restored. You can now accept appointments and set availability.'
            : 'Your access has been revoked. You cannot set availability or accept new appointments until access is restored.',
        })
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
      }

      setIsVerified(newVerificationStatus)
      router.refresh()
      setShowDialog(false)
      
      addToast({
        variant: 'success',
        title: 'Success',
        description: newVerificationStatus 
          ? 'Doctor access restored successfully.'
          : 'Doctor access revoked successfully.',
      })
    } catch (error) {
      console.error('Error updating verification:', error)
      addToast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: `Failed to ${newVerificationStatus ? 'restore access' : 'revoke access'}. Please try again.`,
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
        className={isVerified ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}
        size="sm"
        variant={isVerified ? "destructive" : "default"}
      >
        <UserCheck className="h-4 w-4 mr-2" />
        {isVerified ? 'Revoke Verification' : 'Restore Access'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isVerified ? 'Revoke Doctor Access' : 'Restore Doctor Access'}
            </DialogTitle>
            <DialogDescription>
              {isVerified 
                ? "Are you sure you want to revoke this doctor's access? They will not be able to set availability or accept new appointments until access is restored."
                : "Are you sure you want to restore this doctor's access? This will allow them to accept appointments and set availability."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleToggleVerification}
              className={isVerified ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}
              disabled={isLoading}
              variant={isVerified ? "destructive" : "default"}
            >
              {isLoading 
                ? (isVerified ? 'Revoking...' : 'Restoring...') 
                : (isVerified ? 'Revoke Verification' : 'Restore Access')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
