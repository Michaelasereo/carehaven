import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
          <div className="flex items-center">
            <Image
              src="/carehaven logo.svg"
              alt="Care Haven Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
          <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <Link href="/how-it-works" className="text-gray-700 hover:text-teal-600 transition-colors">How it Works</Link>
            <Link href="/faqs" className="text-gray-700 hover:text-teal-600 transition-colors">FAQs</Link>
            <Link href="/support" className="text-gray-700 hover:text-teal-600 transition-colors">Support</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-teal-600 hover:bg-teal-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Medical Consultations
            <br />
            <span className="text-teal-600">Made Simple & Secure</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with licensed healthcare professionals via secure video consultations. 
            Get prescriptions, request investigations, and manage your health—all from one platform.
          </p>
          <Link href="/auth/signin">
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
      </main>
    </div>
  )
}
