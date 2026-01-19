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

    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
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
            try {
              if (payload.eventType === 'INSERT') {
                setMessages((prev) => {
                  // Avoid duplicates
                  const exists = prev.some(m => m.id === payload.new.id)
                  if (exists) return prev
                  return [...prev, payload.new]
                })
              }
            } catch (error) {
              console.error('Error processing realtime message:', error)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime messages subscription error:', status)
            isSubscribed = false
            // Attempt reconnection after 5 seconds
            reconnectTimeoutId = setTimeout(() => {
              if (!isSubscribed) {
                setupSubscription()
              }
            }, 5000)
          }
        })

      setChannel(channel)
      return channel
    }

    const channel = setupSubscription()

    return () => {
      clearTimeout(reconnectTimeoutId)
      if (channel) {
        channel.unsubscribe()
        supabase.removeChannel(channel)
      }
    }
  }, [receiverId, senderId, supabase])

  return { messages, channel }
}

