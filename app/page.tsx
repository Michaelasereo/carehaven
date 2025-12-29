import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl">Care Haven</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/how-it-works">How it Works</Link>
            <Link href="/faqs">FAQs</Link>
            <Link href="/support">Support</Link>
            <Link href="/auth/signin">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-teal-600 hover:bg-teal-700">Get Started</Button>
            </Link>
          </nav>
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
