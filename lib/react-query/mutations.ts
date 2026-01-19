import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appointmentData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create appointment')
      }

      return result.appointment
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

