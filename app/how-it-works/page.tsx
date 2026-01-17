import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Calendar, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure and confidential healthcare consultations made simple
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-teal-50 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-3">1. Create Your Account</h2>
            <p className="text-gray-600">
              Sign up for our secure platform with end-to-end encryption. Your personal information 
              is protected with industry-leading security measures.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-teal-50 rounded-full">
                <Calendar className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-3">2. Book a Video Consultation</h2>
            <p className="text-gray-600">
              Schedule a confidential, HIPAA-compliant video consultation with a trusted healthcare 
              provider at your convenience.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-teal-50 rounded-full">
                <Stethoscope className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-3">3. Manage Your Health</h2>
            <p className="text-gray-600">
              Receive prescriptions, request lab tests, and track your health records—all securely 
              stored in one convenient platform.
            </p>
          </Card>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-center mb-6">Why Choose Care Haven?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">🔒 Secure & Confidential</h3>
              <p className="text-gray-600">
                HIPAA-compliant platform with end-to-end encryption to protect your health information.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⏰ Convenient</h3>
              <p className="text-gray-600">
                Book appointments and consult with doctors from anywhere, at any time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">👨‍⚕️ Licensed Professionals</h3>
              <p className="text-gray-600">
                All doctors on our platform are verified and licensed healthcare providers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📋 Complete Health Records</h3>
              <p className="text-gray-600">
                Access all your prescriptions, test results, and consultation notes in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
              Get Started Today
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
