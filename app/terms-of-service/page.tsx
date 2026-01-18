import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline">← Back to Home</Button>
          </Link>
        </div>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Care Haven, you accept and agree to be bound by the terms and provision 
              of this agreement. If you do not agree to these Terms of Service, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Care Haven provides a telemedicine platform that connects patients with licensed healthcare providers 
              for virtual consultations, prescription management, and health record management. We are not a 
              healthcare provider ourselves.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed">As a user of Care Haven, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service in compliance with applicable laws</li>
              <li>Not use the service for any unlawful or unauthorized purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Medical Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              Care Haven is a platform that facilitates connections between patients and healthcare providers. 
              We do not provide medical advice, diagnosis, or treatment. All medical services are provided by 
              licensed healthcare providers who are independent practitioners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Payment for consultations is processed through Paystack. All fees are displayed before booking. 
              Refunds are subject to our cancellation policy and applicable healthcare regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Care Haven shall not be liable for any indirect, incidental, special, or consequential damages 
              arising from your use of the platform, except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms of Service, please contact us at support@carehaven.com
            </p>
          </section>

          <section className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500">
              Last updated: January 2025
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
