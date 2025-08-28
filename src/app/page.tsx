// src/app/page.tsx
import Link from 'next/link'
import { Calendar, Clock, Users, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#db2777] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Slot</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/signin"
              className="text-gray-600 hover:text-[#db2777] transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className="bg-[#db2777] hover:bg-[#be185d] text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Simplify Your
            <span className="text-[#db2777] block">Appointment Booking</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Create your personalized booking page in minutes. Let patients book appointments 
            with you 24/7 while you focus on providing excellent care.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/signup"
              className="bg-[#db2777] hover:bg-[#be185d] text-white px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/signin"
              className="border-2 border-[#db2777] text-[#db2777] hover:bg-[#db2777] hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition-all"
            >
              I'm Already a User
            </Link>
          </div>

          {/* Demo URL Example */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-16 max-w-md mx-auto border-2 border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Your booking page will be:</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 font-mono text-[#db2777] font-semibold">
              quickslot.com/dr-smith
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#db2777]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#db2777]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Setup</h3>
            <p className="text-gray-600">
              Get your booking page live in under 5 minutes. No technical knowledge required.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#db2777]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#db2777]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Patient Friendly</h3>
            <p className="text-gray-600">
              Simple booking for patients - no accounts needed. Just name and phone number.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#db2777]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#db2777]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Flexible Scheduling</h3>
            <p className="text-gray-600">
              Set your availability easily. Manage slots, view bookings, all in one place.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#db2777]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#db2777]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
            <p className="text-gray-600">
              Your data is safe with us. HIPAA compliant and secure infrastructure.
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="text-center mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h3>
          <p className="text-gray-600 mb-8">Start free, upgrade when you're ready</p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-100 shadow-sm">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Free</h4>
              <p className="text-3xl font-bold text-[#db2777] mb-4">₹0<span className="text-sm text-gray-500">/month</span></p>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li>✓ 2 hours of slots per day</li>
                <li>✓ Basic booking page</li>
                <li>✓ Email confirmations</li>
                <li>✓ 1 month free trial</li>
              </ul>
            </div>

            {/* Basic Tier */}
            <div className="bg-white rounded-xl p-8 border-2 border-[#db2777] shadow-lg relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#db2777] text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Basic</h4>
              <p className="text-3xl font-bold text-[#db2777] mb-4">₹499<span className="text-sm text-gray-500">/month</span></p>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li>✓ Unlimited daily slots</li>
                <li>✓ Email confirmations</li>
                <li>✓ Basic dashboard</li>
                <li>✓ Email support</li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-100 shadow-sm">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Pro</h4>
              <p className="text-3xl font-bold text-[#db2777] mb-4">₹999<span className="text-sm text-gray-500">/month</span></p>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li>✓ Everything in Basic</li>
                <li>✓ Google Calendar sync</li>
                <li>✓ SMS reminders</li>
                <li>✓ Advanced analytics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-[#db2777] rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of doctors who trust Quick Slot for their appointment booking
          </p>
          <Link 
            href="/signup"
            className="bg-white text-[#db2777] px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 mt-20">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 Quick Slot. Made with ❤️ for doctors who care.</p>
        </div>
      </footer>
    </div>
  )
}