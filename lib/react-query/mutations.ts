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

        // Parse JSON response with error handling
        let result: any
        try {
          const responseText = await response.text()
          if (!responseText) {
            throw new Error('Empty response received from server')
          }
          result = JSON.parse(responseText)
        } catch (parseError) {
          console.error('[useCreateAppointment] Failed to parse response:', parseError)
          throw new Error('Invalid response format: Unable to parse server response')
        }

        // Validate response structure
        if (!result) {
          console.error('[useCreateAppointment] Response is null or undefined')
          throw new Error('Invalid response: Empty response received from server')
        }

        if (!result.appointment) {
          // Log the actual response structure for debugging
          console.error('[useCreateAppointment] Invalid response structure:', {
            hasResult: !!result,
            resultKeys: result ? Object.keys(result) : [],
            result: result,
            status: response.status,
            statusText: response.statusText,
          })
          throw new Error(
            result.error 
              ? `Failed to create appointment: ${result.error}`
              : 'Invalid response: Appointment data not found in server response. Please try again.'
          )
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

