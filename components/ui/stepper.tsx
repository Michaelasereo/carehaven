'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted &&
                      'bg-teal-600 border-teal-600 text-white',
                    isCurrent &&
                      'bg-teal-50 border-teal-600 text-teal-600',
                    !isCompleted &&
                      !isCurrent &&
                      'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center',
                    isCurrent && 'text-teal-600',
                    isCompleted && 'text-gray-900',
                    !isCompleted && !isCurrent && 'text-gray-400'
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-teal-600' : 'bg-gray-300'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
