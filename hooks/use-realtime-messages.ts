'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(receiverId: string | undefined, senderId?: string | undefined) {
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!receiverId && !senderId) return

    const channel = supabase
      .channel(`messages-${receiverId || senderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: receiverId && senderId
            ? `or(receiver_id.eq.${receiverId},sender_id.eq.${senderId})`
            : receiverId
            ? `receiver_id=eq.${receiverId}`
            : `sender_id=eq.${senderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => {
              // Avoid duplicates
              const exists = prev.some(m => m.id === payload.new.id)
              if (exists) return prev
              return [...prev, payload.new]
            })
          }
        }
      )
      .subscribe()

    setChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [receiverId, senderId, supabase])

  return { messages, channel }
}

