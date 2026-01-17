'use client'

import { useState, useEffect } from 'react'
import { SettingsNav } from '@/components/settings/settings-nav'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Bell, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DoctorNotificationsSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)

  useEffect(() => {
    const loadPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setEmailNotifications(profile.notification_preferences?.email ?? true)
        setSmsNotifications(profile.notification_preferences?.sms ?? true)
      }

      setLoading(false)
    }

    loadPreferences()
  }, [supabase, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: {
            email: emailNotifications,
            sms: smsNotifications,
          },
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Notification preferences saved successfully!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SettingsNav basePath="/doctor" />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Preferences</h1>
        <p className="text-gray-600 mt-2">
          Manage your notification preferences and account settings
        </p>
      </div>

      <SettingsNav basePath="/doctor" />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Mail className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                  Allow Email Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive appointment notifications, patient messages, and updates via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Bell className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <Label htmlFor="sms-notifications" className="text-base font-medium cursor-pointer">
                    Allow SMS Notifications
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive appointment reminders via SMS text messages
                  </p>
                </div>
              </div>
              <Switch
                id="sms-notifications"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
