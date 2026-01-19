import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ConsultationPriceManager } from '@/components/admin/consultation-price-manager'
import { FAQManager } from '@/components/admin/faq-manager'

export default async function AdminSystemSettingsPage() {
  // Auth and role checks are handled by app/(dashboard)/layout.tsx
  const supabase = await createClient()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage global system configuration and preferences
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConsultationPriceManager />
        </div>
        
        <FAQManager />
      </div>
    </div>
  )
}
