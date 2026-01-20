import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Footer } from '@/components/layout/Footer'
import { Stethoscope, Calendar, FileText, Clock, ArrowRight } from 'lucide-react'
import { HomepageAuthHandler } from '@/components/auth/homepage-auth-handler'

// FAQ Accordion Component
function FAQAccordion({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  if (faqs.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No FAQs available at the moment.</p>
      </div>
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-gray-600">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default async function Home() {
  // Fetch FAQs using Supabase client (with public RLS policy)
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  
  let faqs: Array<{ question: string; answer: string }> = []
  let displayCount = 4
  
  try {
    // Get display count from system_settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('faq_display_count')
      .single()
    
    displayCount = settings?.faq_display_count || 4
    
    // Fetch active FAQs (public RLS policy allows this)
    const { data: faqData, error } = await supabase
      .from('faqs')
      .select('question, answer')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(displayCount)
    
    if (!error && faqData) {
      faqs = faqData
    } else if (error) {
      console.error('Error fetching FAQs:', error)
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    // Fallback to empty array if fetch fails
    faqs = []
  }
  return (
    <div className="flex min-h-screen flex-col">
      <HomepageAuthHandler />
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 relative">
          <div className="flex items-center">
        <img
          src="/carehaven-logo.svg"
          alt="Care Haven Logo"
          className="h-6 md:h-8 w-auto"
        />
          </div>
          <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-4">
            <Link href="/" className="text-gray-700 hover:text-teal-600 transition-colors">Home</Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-teal-600 transition-colors">How it Works</Link>
            <Link href="#faqs" className="text-gray-700 hover:text-teal-600 transition-colors">FAQs</Link>
            <a href="mailto:mycarehaven@gmail.com" className="text-gray-700 hover:text-teal-600 transition-colors">Support</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="text-sm md:text-base px-3 md:px-4 py-2">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-sm md:text-base px-3 md:px-4 py-2">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 px-4">
            Medical Consultations
            <br />
            <span className="text-teal-600 italic font-normal text-2xl md:text-4xl font-serif">Made Simple & Secure</span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Secure video consultations to home-based care and ongoing monitoring. We ensure you are never left navigating health alone.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 min-h-[44px]">
              Book a Consultation
            </Button>
          </Link>
          <p className="mt-4 text-sm md:text-base text-gray-600 px-4">
            Are you a healthcare provider?{' '}
            <a href="mailto:mycarehaven@gmail.com" className="text-teal-600 hover:underline">
              Join our platform→
            </a>
          </p>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-gray-50 py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-8 md:mb-12 text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs md:text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure and Confidential
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mb-8 md:mb-12">
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <img
                    src="/checkfills.svg"
                    alt="Verified"
                    className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0"
                  />
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Create Your Account</h3>
                </div>
                <p className="text-sm md:text-base text-gray-600">
                  Sign up for our secure platform with end-to-end encryption. Your personal information is protected with industry-leading security measures.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <img
                    src="/checkfills.svg"
                    alt="Verified"
                    className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0"
                  />
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Book a Video Consultation</h3>
                </div>
                <p className="text-sm md:text-base text-gray-600">
                  Schedule a confidential, HIPAA-compliant video consultation with a trusted healthcare provider at your convenience.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <img
                    src="/checkfills.svg"
                    alt="Verified"
                    className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0"
                  />
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Manage Your Health in One Place</h3>
                </div>
                <p className="text-sm md:text-base text-gray-600">
                  Receive prescriptions, request lab tests, and track your health records—all securely stored in one convenient platform.
                </p>
              </div>
            </div>

            {/* Dashboard Snapshot */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-2xl p-4 md:p-8 border border-gray-200 overflow-x-auto">
                {/* Dashboard Header */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Dashboard</h2>
                
                {/* Patient Demographics */}
                <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-gray-700 mb-4 md:mb-6 flex-wrap">
                  <span>Name: Odeyemi Michael</span>
                </div>
                
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                  {/* Total Consultations */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 rounded-lg bg-teal-100">
                        <Stethoscope className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">06</div>
                        <div className="text-xs text-gray-600">Total Consultations</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upcoming Appointments */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 rounded-lg bg-teal-100">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">02</div>
                        <div className="text-xs text-gray-600">Upcoming Appointments</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Investigations */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 rounded-lg bg-teal-100">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">02</div>
                        <div className="text-xs text-gray-600">Investigations</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Upcoming Appointments Section */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    Upcoming Appointments
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    {/* Appointment Card 1 */}
                    <div className="bg-white border-l-4 border-l-teal-600 border border-gray-200 rounded-lg p-2.5 md:p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-xs md:text-sm text-gray-900">Consultation with Dr Tunde</h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 whitespace-nowrap">confirmed</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Jan 20, 2025</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>1:00PM - 2:00PM</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 md:h-6 md:w-6 rounded-full flex-shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Appointment Card 2 */}
                    <div className="bg-white border-l-4 border-l-teal-600 border border-gray-200 rounded-lg p-2.5 md:p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-xs md:text-sm text-gray-900">Consultation with Dr Adetola</h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">scheduled</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Jan 22, 2025</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>4:00PM - 5:00PM</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 md:h-6 md:w-6 rounded-full flex-shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
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
        <section id="faqs" className="bg-gray-50 py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center mb-8 md:mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs md:text-sm font-medium mb-4">
                Secure and Confidential
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 px-4 text-center">Frequently asked questions</h2>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Left Column - Introduction */}
              <div>
                <p className="text-lg text-gray-600">
                  Care Haven is a secure, all-in-one platform for convenient healthcare. Get the answers you need to get started.
                </p>
              </div>
              
              {/* Right Column - FAQ Accordion */}
              <div>
                <FAQAccordion faqs={faqs} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
