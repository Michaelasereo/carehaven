'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface TrendIndicatorProps {
  value: number
  period: string
}

export function TrendIndicator({ value, period }: TrendIndicatorProps) {
  const isPositive = value >= 0
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <span className={`text-sm font-medium flex items-center gap-1 ${colorClass}`}>
      <Icon className="h-4 w-4" />
      {Math.abs(value)}% vs {period}
    </span>
  )
}
