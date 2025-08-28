// src/lib/version.ts
export const APP_VERSION = '1.0.0-beta'

export const VERSION_CHANGELOG = {
  '1.0.0-beta': {
    date: '2024-12-28',
    changes: [
      'Initial beta release',
      'Doctor registration and profile management',
      'Recurring schedule creation with custom intervals',
      'Patient booking system (no registration required)',
      'Real-time appointment management',
      'Mobile-responsive design',
      'Complete appointment workflow'
    ]
  },
}

export const getBuildInfo = () => ({
  version: APP_VERSION,
  buildDate: process.env.BUILD_DATE || new Date().toISOString().split('T')[0],
  environment: process.env.NODE_ENV || 'development'
})