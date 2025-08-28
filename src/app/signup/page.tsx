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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const [message, setMessage] = useState('')
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
    setMessage('')

    try {
      // Check if username is already taken first
      const { data: existingUser, error: checkError } = await supabase
        .from('doctors')
        .select('username')
        .eq('username', data.username)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking username:', checkError)
        setError('Unable to verify username availability. Please try again.')
        setIsLoading(false)
        return
      }

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
        console.error('Auth error:', authError)
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        // Check if user needs email confirmation
        if (!authData.user.email_confirmed_at) {
          setError('')
          setMessage(`We've sent a verification email to ${data.email}. Please check your inbox and click the verification link to complete your signup.`)
          setIsLoading(false)
          return
        }

        // If email is already confirmed, create doctor record
        const doctorData = {
          id: authData.user.id,
          email: data.email,
          username: data.username,
          tier: 'free' as const,
          profile_completed: false
        }

        console.log('Attempting to insert doctor data:', doctorData)

        const { data: insertedData, error: dbError } = await supabase
          .from('doctors')
          .insert(doctorData)
          .select()

        if (dbError) {
          console.error('Database error details:', {
            message: dbError.message,
            code: dbError.code,
            details: dbError.details,
            hint: dbError.hint
          })
          
          // If the error is about the user already existing, try to sign them in instead
          if (dbError.code === '23505') { // unique violation
            setError('An account with this email already exists. Try signing in instead.')
          } else {
            setError(`Failed to create account: ${dbError.message || 'Unknown database error'}`)
          }
          setIsLoading(false)
          return
        }

        console.log('Successfully created doctor record:', insertedData)
        
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
        <Card className="shadow-lg border border-gray-100">
          <CardContent className="p-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-6">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  onChange={(e) => {
                    register('email').onChange(e)
                    handleEmailChange(e)
                  }}
                  placeholder="doctor@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Username (Permanent)</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    {...register('username')}
                    placeholder="dr-smith"
                    className="pr-28"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-500">quick-doc-slot.vercel.app</span>
                  </div>
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Your booking page will be: quick-doc-slot.vercel.app/{watch('username') || 'your-username'}
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 py-0 h-full hover:bg-transparent"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/signin" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Free Trial Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🎉 Free for 1 month. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}