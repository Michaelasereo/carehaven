'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export function ConsultationDurationManager() {
  const supabase = createClient()
  const [consultationDuration, setConsultationDuration] = useState<number>(45)
  const [inputValue, setInputValue] = useState<string>('45')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

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

    // Fetch initial duration
    const fetchDuration = async () => {
      try {
        const response = await fetch('/api/admin/settings/consultation-duration')
        if (response.ok) {
          const data = await response.json()
          const duration = data.consultation_duration || 45
          setConsultationDuration(duration)
          setInputValue(duration.toString())
        }
      } catch (error) {
        console.error('Error fetching consultation duration:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDuration()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('system-settings-duration')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          const newDuration = Number(payload.new.consultation_duration) || 45
          setConsultationDuration(newDuration)
          setInputValue(newDuration.toString())
          
          // Show notification when duration is updated by another admin
          setSuccessMessage(`Consultation duration has been updated to ${newDuration} minutes`)
          setTimeout(() => setSuccessMessage(null), 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      // Validate input
      const duration = parseInt(inputValue, 10)
      if (isNaN(duration) || duration < 1) {
        setError('Please enter a valid positive integer (minimum 1 minute)')
        setIsSaving(false)
        return
      }

      // Update duration via API
      const response = await fetch('/api/admin/settings/consultation-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultation_duration: duration }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update duration')
      }

      const data = await response.json()
      const newDuration = data.consultation_duration || duration
      setConsultationDuration(newDuration)
      setInputValue(newDuration.toString())
      setSuccessMessage(`Consultation duration has been set to ${newDuration} minutes`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      console.error('Error updating consultation duration:', error)
      setError(error.message || 'Failed to update duration. Please try again.')
      setSuccessMessage(null)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading consultation duration...</span>
        </div>
      </Card>
    )
  }

  const bufferMinutes = 15
  const totalBlockingTime = consultationDuration + bufferMinutes

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold">Consultation Duration</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consultation-duration">Duration per Consultation (minutes)</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                id="consultation-duration"
                type="number"
                min="1"
                step="1"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError(null)
                }}
                placeholder="45"
                disabled={userRole !== 'super_admin'}
              />
            </div>
            {userRole === 'super_admin' && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-1 text-sm text-gray-600">
            <p>
              Current duration: <span className="font-semibold">{consultationDuration} minutes</span>
            </p>
            <p className="text-xs text-gray-500">
              Total blocking time: <span className="font-medium">{totalBlockingTime} minutes</span> ({consultationDuration} min consultation + {bufferMinutes} min buffer)
            </p>
          </div>

          {parseInt(inputValue, 10) !== consultationDuration && !isNaN(parseInt(inputValue, 10)) && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                New duration: {inputValue} minutes (total blocking: {parseInt(inputValue, 10) + bufferMinutes} minutes)
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
