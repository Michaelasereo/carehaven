'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'

interface CallInterfaceProps {
  roomUrl: string
  token: string
  onLeave: () => void
}

export function CallInterface({ roomUrl, token, onLeave }: CallInterfaceProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)

  useEffect(() => {
    if (iframeRef.current) {
      const daily = DailyIframe.wrap(iframeRef.current, {
        showLeaveButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
        },
      })

      daily.join({ url: roomUrl, token })

      daily.on('left-meeting', () => {
        onLeave()
      })

      return () => {
        daily.leave()
      }
    }
  }, [roomUrl, token, onLeave])

  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

