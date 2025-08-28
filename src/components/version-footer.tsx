"use client"
// src/components/version-footer.tsx
import { useState } from 'react'

const VERSION = '1.0.0-beta'
const BUILD_DATE = new Date().toLocaleDateString()

export function VersionFooter() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            © 2024 Quick Slot. Made with ❤️ for doctors who care.
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="hover:text-gray-600 transition-colors"
            title="App version"
          >
            v{VERSION}
          </button>
        </div>
        
        {showDetails && (
          <div className="mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>Version: {VERSION}</div>
              <div>Build: {BUILD_DATE}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}