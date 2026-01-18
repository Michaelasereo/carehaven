import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline">← Back to Home</Button>
          </Link>
        </div>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Care Haven ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you use our telemedicine platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Personal identification information (name, email, phone number)</li>
              <li>Health information and medical records</li>
              <li>Appointment and consultation data</li>
              <li>Payment information (processed securely through Paystack)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our telemedicine services</li>
              <li>Process appointments and consultations</li>
              <li>Send appointment reminders and notifications</li>
              <li>Process payments and prevent fraud</li>
              <li>Comply with legal obligations and healthcare regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your personal health information, 
              including end-to-end encryption, secure data storage, and regular security audits. All data 
              transmission is encrypted using TLS 1.3.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. HIPAA Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              Care Haven is designed to comply with HIPAA (Health Insurance Portability and Accountability Act) 
              requirements. We maintain strict safeguards to protect your Protected Health Information (PHI).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at support@carehaven.com
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
