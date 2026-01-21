import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointmentData: any) => {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        const response = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(appointmentData),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Check if response is ok
        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = 'Failed to create appointment'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If response is not JSON, use status text
            errorMessage = `Request failed with status ${response.status}`
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()

        if (!result.appointment) {
          throw new Error('Invalid response: appointment not found in response')
        }

        return result.appointment
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        // Handle abort/timeout
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection and try again.')
        }
        
        // Handle network errors
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('socket')) {
          throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.')
        }
        
        // Re-throw other errors
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateAppointment() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, ...updates }: { userId: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] })
    },
  })
}

