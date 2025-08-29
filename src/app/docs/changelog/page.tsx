// src/app/docs/changelog/page.tsx
import Link from 'next/link'
import { Calendar, ArrowLeft, Plus, Bug, Zap, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VERSION_CHANGELOG, APP_VERSION } from '@/lib/version'

export default function ChangelogPage() {
  const versions = Object.entries(VERSION_CHANGELOG).reverse() // Latest first

  const getChangeIcon = (change: string) => {
    if (change.toLowerCase().includes('fix') || change.toLowerCase().includes('bug')) {
      return <Bug className="w-4 h-4 text-red-500" />
    }
    if (change.toLowerCase().includes('performance') || change.toLowerCase().includes('optimization')) {
      return <Zap className="w-4 h-4 text-yellow-500" />
    }
    return <Plus className="w-4 h-4 text-green-500" />
  }

  const getVersionBadge = (version: string) => {
    if (version === APP_VERSION) {
      return <Badge className="ml-2">Current</Badge>
    }
    if (version.includes('beta')) {
      return <Badge variant="secondary" className="ml-2">Beta</Badge>
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to App</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Quick Slot</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Changelog</h2>
          <p className="text-gray-600">Track our progress and see what&#39;s new in Quick Slot</p>
        </div>

        {/* Version History */}
        <div className="space-y-8">
          {versions.map(([version, details]) => (
            <Card key={version}>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Star className="w-5 h-5 text-primary mr-2" />
                  Version {version}
                  {getVersionBadge(version)}
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {details.date}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {details.changes.map((change, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {getChangeIcon(change)}
                      <span className="text-gray-700">{change}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              Upcoming Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Release (v1.0.1-beta)</h4>
                <div className="space-y-2">
                  {[
                    'Email notifications for booking confirmations',
                    'Performance improvements and bug fixes',
                    'Enhanced mobile experience',
                    'Better error handling'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-4 h-4 border border-gray-300 rounded mt-0.5"></div>
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Future Plans</h4>
                <div className="space-y-2">
                  {[
                    'Google Calendar integration',
                    'SMS reminders for appointments',
                    'Advanced analytics dashboard',
                    'Payment integration'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-4 h-4 border border-gray-300 rounded mt-0.5"></div>
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Help Us Improve
            </h3>
            <p className="text-gray-600 mb-4">
              Found a bug or have a feature request? We&#39;d love to hear from you!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="mailto:support@quickslot.com?subject=Feature Request" 
                className="text-primary hover:underline font-medium"
              >
                📧 Send Feedback
              </a>
              <a 
                href="mailto:support@quickslot.com?subject=Bug Report" 
                className="text-primary hover:underline font-medium"
              >
                🐛 Report Bug
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}