// src/components/loading.tsx
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ 
  text = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-primary animate-spin mb-4`} />
      <p className="text-gray-600">{text}</p>
    </div>
  )
}

export function PageLoading({ text = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <Loading text={text} size="lg" />
    </div>
  )
}

export function CardLoading({ text = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div className={`p-8 text-center ${className}`}>
      <Loading text={text} size="md" />
    </div>
  )
}