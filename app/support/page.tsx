import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Mail, Phone, MessageCircle, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Support</h1>
        
        <div className="space-y-6">
          <section>
            <p className="text-lg text-gray-700 mb-8">
              We're here to help! Contact our support team through any of the channels below.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-50 rounded-lg">
                  <Mail className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-4">
                    Send us an email and we'll respond within 24 hours.
                  </p>
                  <a
                    href="mailto:support@carehaven.com"
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    support@carehaven.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-50 rounded-lg">
                  <Phone className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
                  <p className="text-gray-600 mb-4">
                    Call us during business hours (9 AM - 5 PM WAT, Monday-Friday).
                  </p>
                  <a
                    href="tel:+2348000000000"
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    +234 800 000 0000
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">How do I book an appointment?</h3>
                  <p className="text-gray-600">
                    Navigate to Appointments → Book Appointment, select a doctor, choose a date and time, 
                    and complete payment to confirm your appointment.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How do video consultations work?</h3>
                  <p className="text-gray-600">
                    When it's time for your appointment, click "Join Consultation" in your appointments list. 
                    The video call will open in a secure, HIPAA-compliant interface.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What payment methods are accepted?</h3>
                  <p className="text-gray-600">
                    We accept all major payment methods through Paystack, including cards, bank transfers, 
                    and mobile money.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Is my information secure?</h3>
                  <p className="text-gray-600">
                    Yes! We use end-to-end encryption and comply with HIPAA regulations to ensure your 
                    personal health information is protected.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <div className="flex gap-4 mt-8">
            <Link href="/#faqs">
              <Button variant="outline" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                View All FAQs
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
