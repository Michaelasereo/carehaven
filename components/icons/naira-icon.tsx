import React from 'react'

interface NairaIconProps {
  className?: string
  size?: number
}

export function NairaIcon({ className = "h-5 w-5", size }: NairaIconProps) {
  return (
    <span 
      className={className}
      style={{ 
        fontSize: size ? `${size}px` : undefined,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      ₦
    </span>
  )
}
