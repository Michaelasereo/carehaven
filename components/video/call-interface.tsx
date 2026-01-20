'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'

interface CallInterfaceProps {
  roomUrl: string
  token: string
  onLeave: () => void
}

export function CallInterface({ roomUrl, token, onLeave }: CallInterfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callFrameRef = useRef<any>(null)
  const onLeaveRef = useRef(onLeave)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)

  useEffect(() => {
    onLeaveRef.current = onLeave
  }, [onLeave])

  useEffect(() => {
    const el = containerRef.current
    // Prevent duplicate DailyIframe instances (e.g. re-renders / StrictMode double-invoke in dev)
    if (!el || callFrameRef.current) return

    let cancelled = false

    const setup = async () => {
      // During Fast Refresh / StrictMode, a previous call instance can survive briefly.
      // Daily enforces a single instance by default, so destroy any existing one first.
      const existing = (DailyIframe as any).getCallInstance?.()
      if (existing && existing !== callFrameRef.current) {
        try {
          await existing.destroy?.()
        } catch (e) {
          // If destroy fails, continue and let Daily surface the error.
          console.warn('Failed to destroy existing Daily call instance:', e)
        }
      }

      if (cancelled || callFrameRef.current) return

      const daily = DailyIframe.createFrame(el, {
        showLeaveButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
        },
      })

      callFrameRef.current = daily

      const handleLeftMeeting = () => onLeaveRef.current()
      daily.on('left-meeting', handleLeftMeeting)

      daily.join({ url: roomUrl, token })
    }

    setup()

    return () => {
      cancelled = true
      const daily = callFrameRef.current
      callFrameRef.current = null
      if (!daily) return
      try {
        daily.leave?.()
        daily.destroy?.()
      } catch {
        // ignore
      }
    }
  }, [roomUrl, token, onLeave])

  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-1">
        <div
          ref={containerRef}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

