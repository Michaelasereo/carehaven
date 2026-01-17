'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function ConsultationPriceManager() {
  const supabase = createClient()
  const [consultationPrice, setConsultationPrice] = useState<number>(5000)
  const [inputValue, setInputValue] = useState<string>('50')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Format: Convert kobo to naira for display (5000 kobo = 50 naira)
  const formatPriceForDisplay = (priceInKobo: number) => {
    return (priceInKobo / 100).toString()
  }

  // Parse: Convert naira input to kobo (50 naira = 5000 kobo)
  const parsePriceFromInput = (priceInNaira: string) => {
    return Math.round(parseFloat(priceInNaira) * 100)
  }

  useEffect(() => {
    // Fetch initial price
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/admin/settings/consultation-price')
        if (response.ok) {
          const data = await response.json()
          const priceInKobo = data.consultation_price || 5000
          setConsultationPrice(priceInKobo)
          setInputValue(formatPriceForDisplay(priceInKobo))
        }
      } catch (error) {
        console.error('Error fetching consultation price:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrice()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('system-settings-price')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          const newPrice = Number(payload.new.consultation_price) || 5000
          setConsultationPrice(newPrice)
          setInputValue(formatPriceForDisplay(newPrice))
          
          // Show notification when price is updated by another admin
          setSuccessMessage(`Consultation price has been updated to ₦${formatPriceForDisplay(newPrice)}`)
          setTimeout(() => setSuccessMessage(null), 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
      }, [supabase])

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      // Validate input
      const priceInNaira = parseFloat(inputValue)
      if (isNaN(priceInNaira) || priceInNaira < 0) {
        setError('Please enter a valid positive number')
        setIsSaving(false)
        return
      }

      const priceInKobo = parsePriceFromInput(inputValue)

      // Update price via API
      const response = await fetch('/api/admin/settings/consultation-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceInKobo }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update price')
      }

      const data = await response.json()
      const newPrice = data.consultation_price || priceInKobo
      setConsultationPrice(newPrice)
      setInputValue(formatPriceForDisplay(newPrice))
      setSuccessMessage(`Consultation price has been set to ₦${formatPriceForDisplay(newPrice)}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      console.error('Error updating consultation price:', error)
      setError(error.message || 'Failed to update price. Please try again.')
      setSuccessMessage(null)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading consultation price...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-green-600">₦</span>
          <h3 className="text-lg font-semibold">Consultation Price</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consultation-price">Price per Consultation (NGN)</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
              <Input
                id="consultation-price"
                type="number"
                min="0"
                step="0.01"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError(null)
                }}
                className="pl-8"
                placeholder="50.00"
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Current price: <span className="font-semibold">₦{formatPriceForDisplay(consultationPrice)}</span> per consultation
          </p>

          {parsePriceFromInput(inputValue) !== consultationPrice && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>New price: ₦{inputValue} (will apply to all new bookings)</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
