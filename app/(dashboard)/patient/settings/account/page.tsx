'use client'

import { useState } from 'react'
import { SettingsNav } from '@/components/settings/settings-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

export default function AccountSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
      addToast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'Failed to sign out. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      addToast({
        variant: 'destructive',
        title: 'Confirmation Required',
        description: 'Please type DELETE to confirm',
      })
      return
    }

    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete user account (this will cascade delete profile due to RLS)
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      
      if (error) {
        // If admin API is not available, use regular delete
        // Note: This might require server-side implementation
        throw error
      }

      await supabase.auth.signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error deleting account:', error)
      addToast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Failed to delete account. Please contact support.',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Preferences</h1>
        <p className="text-gray-600 mt-2">
          Manage your notification preferences and account settings
        </p>
      </div>

      <SettingsNav basePath="/patient" />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Account Management</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Sign Out of Account</Label>
              <p className="text-sm text-gray-600 mt-1">
                Sign out of your Care Haven account on this device
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>

          <div className="border-t pt-6">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Danger Zone</h3>
                  <p className="text-sm text-red-800 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all associated data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <span className="font-bold">DELETE</span> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== 'DELETE'}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
