// src/lib/version.ts
export const APP_VERSION = '1.0.2-beta'

export const VERSION_CHANGELOG = {
  '1.0.2-beta': {
    date: '2025-12-29',
    changes: [
      'Enhanced slot management with individual slot control',
      'Flexible generation options (7/15/30 days)',
      'Add single appointments without affecting recurring schedules',
      'Improved slot deletion with booking protection'
    ]
  },
  '1.0.1-beta': {
    date: '2025-12-29',
    changes: [
      'Fixed email verification callback flow',
      'Improved error handling and debugging',
      'Enhanced auth workflow stability'
    ]
  },
  '1.0.0-beta': {
    date: '2025-12-28',
    changes: [
      'Initial beta release',
      'Doctor registration and profile management',
      'Recurring schedule creation with custom intervals',
      'Patient booking system (no registration required)',
      'Real-time appointment management',
      'Mobile-responsive design',
      'Complete appointment workflow'
    ]
  }
}

export const getBuildInfo = () => ({
  version: APP_VERSION,
  buildDate: process.env.BUILD_DATE || new Date().toISOString().split('T')[0],
  environment: process.env.NODE_ENV || 'development'
})