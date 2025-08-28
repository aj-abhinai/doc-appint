// src/app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Username can only contain lowercase letters, numbers, and hyphens')
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  })

  // Auto-generate username from email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value
    if (emailValue && !watch('username')) {
      const suggestedUsername = emailValue
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .substring(0, 20)
      setValue('username', suggestedUsername)
    }
  }

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setError('')

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('doctors')
        .select('username')
        .eq('username', data.username)
        .single()

      if (existingUser) {
        setError('Username is already taken. Please choose another one.')
        setIsLoading(false)
        return
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username
          }
        }
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        // Insert into doctors table
        const { error: dbError } = await supabase
          .from('doctors')
          .insert({
            id: authData.user.id,
            email: data.email,
            username: data.username,
            tier: 'free',
            profile_completed: false
          })

        if (dbError) {
          console.error('Database error:', dbError)
          setError('Failed to create account. Please try again.')
          setIsLoading(false)
          return
        }

        // Redirect to accounts page to complete profile
        router.push('/accounts')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-[#db2777] rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Quick Slot</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Start accepting appointments in minutes</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                onChange={(e) => {
                  register('email').onChange(e)
                  handleEmailChange(e)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                placeholder="doctor@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username (Permanent)
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('username')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                  placeholder="dr-smith"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-xs text-gray-500">.quickslot.com</span>
                </div>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Your booking page will be: quickslot.com/{watch('username') || 'your-username'}
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#db2777] hover:bg-[#be185d] disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="text-[#db2777] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Free Trial Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🎉 Free for 1 month, then ₹499/month. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}