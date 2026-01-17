import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Footer } from '@/components/layout/Footer'
import { Stethoscope, Calendar, FileText, Clock, ArrowRight } from 'lucide-react'

// FAQ Accordion Component
function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-left">
          What is Care Haven?
        </AccordionTrigger>
        <AccordionContent className="text-gray-600">
          Care Haven is a secure and confidential digital health platform designed for encrypted video consultations, virtual visits, electronic prescriptions, lab referrals, and health record management.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left">
          Is my information secure?
        </AccordionTrigger>
        <AccordionContent className="text-gray-600">
          Yes, absolutely. Care Haven uses industry-leading security measures including end-to-end encryption, 
          HIPAA-compliant data storage, and regular security audits. Your personal health information is protected 
          with the same standards used by major healthcare institutions.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left">
          How do I book an appointment?
        </AccordionTrigger>
        <AccordionContent className="text-gray-600">
          Booking an appointment is simple. Sign up for a free account, browse available healthcare providers, 
          select a convenient time slot, and confirm your appointment. You'll receive confirmation and reminders 
          via email and SMS before your consultation.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger className="text-left">
          Can I get a prescription through Care Haven?
        </AccordionTrigger>
        <AccordionContent className="text-gray-600">
          Yes, licensed healthcare providers on our platform can issue electronic prescriptions after a consultation. 
          Prescriptions are sent directly to your preferred pharmacy and can also be viewed in your Care Haven account 
          for easy reference and management.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
          <div className="flex items-center">
        <Image
          src="/carehaven%20logo.svg"
          alt="Care Haven Logo"
          width={120}
          height={32}
          className="h-8 w-auto"
          priority
          unoptimized
        />
          </div>
          <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <Link href="/" className="text-gray-700 hover:text-teal-600 transition-colors">Home</Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-teal-600 transition-colors">How it Works</Link>
            <Link href="/faqs" className="text-gray-700 hover:text-teal-600 transition-colors">FAQs</Link>
            <Link href="/support" className="text-gray-700 hover:text-teal-600 transition-colors">Support</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-teal-600 hover:bg-teal-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl font-bold mb-4">
            Medical Consultations
            <br />
            <span className="text-teal-600 italic font-normal text-4xl font-serif">Made Simple & Secure</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Secure video consultations to home-based care and ongoing monitoring. We ensure you are never left navigating health alone.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
              Book a Consultation
            </Button>
          </Link>
          <p className="mt-4 text-gray-600">
            Are you a healthcare provider?{' '}
            <Link href="/doctor-enrollment" className="text-teal-600 hover:underline">
              Join our platform→
            </Link>
          </p>
        </section>

        {/* How It Works Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure and Confidential
              </span>
              <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/checkfills.svg"
                    alt="Verified"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <h3 className="text-xl font-bold text-gray-900">Create Your Account</h3>
                </div>
                <p className="text-gray-600">
                  Sign up for our secure platform with end-to-end encryption. Your personal information is protected with industry-leading security measures.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/checkfills.svg"
                    alt="Verified"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <h3 className="text-xl font-bold text-gray-900">Book a Video Consultation</h3>
                </div>
                <p className="text-gray-600">
                  Schedule a confidential, HIPAA-compliant video consultation with a trusted healthcare provider at your convenience.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/checkfills.svg"
                    alt="Verified"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <h3 className="text-xl font-bold text-gray-900">Manage Your Health in One Place</h3>
                </div>
                <p className="text-gray-600">
                  Receive prescriptions, request lab tests, and track your health records—all securely stored in one convenient platform.
                </p>
              </div>
            </div>

            {/* Dashboard Snapshot */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-200">
                {/* Dashboard Header */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
                
                {/* Patient Demographics */}
                <div className="flex gap-6 text-sm text-gray-700 mb-6 flex-wrap">
                  <span>Name: Odeyemi Michael</span>
                </div>
                
                {/* Metric Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {/* Total Consultations */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100">
                        <Stethoscope className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">06</div>
                        <div className="text-xs text-gray-600">Total Consultations</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Appointments */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100">
                        <Calendar className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">02</div>
                        <div className="text-xs text-gray-600">Upcoming Appointments</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Investigations */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100">
                        <FileText className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">02</div>
                        <div className="text-xs text-gray-600">Investigations</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Upcoming Appointments Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Appointments
                  </h3>
                  <div className="space-y-3">
                    {/* Appointment Card 1 */}
                    <div className="bg-white border-l-4 border-l-teal-600 border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">Consultation with Dr Tunde</h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">confirmed</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Jan 20, 2025</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>1:00PM - 2:00PM</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Appointment Card 2 */}
                    <div className="bg-white border-l-4 border-l-teal-600 border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">Consultation with Dr Adetola</h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">scheduled</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Jan 22, 2025</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>4:00PM - 5:00PM</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-4">
                Secure and Confidential
              </span>
              <h2 className="text-4xl font-bold text-gray-900">Frequently asked questions</h2>
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
              {/* Left Column - Introduction */}
              <div>
                <p className="text-lg text-gray-600">
                  Care Haven is a secure, all-in-one platform for convenient healthcare. Get the answers you need to get started.
                </p>
              </div>
              
              {/* Right Column - FAQ Accordion */}
              <div>
                <FAQAccordion />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
