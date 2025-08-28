// src/app/accounts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, User, Clock, Save, ArrowLeft, Plus, Trash2, Copy, Check } from 'lucide-react'
import { supabase, Doctor, TimeSlot } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  specialty: z.string().min(2, 'Specialty is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
})

type ProfileForm = z.infer<typeof profileSchema>

const timeSlotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required')
})

type TimeSlotForm = z.infer<typeof timeSlotSchema>

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'slots'>('profile')
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const router = useRouter()

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  })

  const slotForm = useForm<TimeSlotForm>({
    resolver: zodResolver(timeSlotSchema)
  })

  useEffect(() => {
    const loadDoctorData = async () => {
      await fetchDoctorData()
    }
    loadDoctorData()
  }, [])

  useEffect(() => {
    if (activeTab === 'slots') {
      fetchTimeSlots()
    }
  }, [activeTab])

  const fetchDoctorData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single()

      if (doctorError) {
        console.error('Doctor fetch error:', doctorError)
        
        // If no row found, create a basic doctor record
        if (doctorError.code === 'PGRST116') {
          const { data: newDoctor, error: createError } = await supabase
            .from('doctors')
            .insert({
              id: user.id,
              email: user.email || '',
              username: user.user_metadata?.username || `user-${user.id.slice(0, 8)}`,
              tier: 'free',
              profile_completed: false
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating doctor record:', createError)
            setError('Failed to create account. Please try signing up again.')
            return
          }

          setDoctor(newDoctor)
          return
        }
        
        setError('Failed to load account data')
        return
      }

      setDoctor(doctorData)

      // Populate form with existing data
      if (doctorData) {
        profileForm.reset({
          full_name: doctorData.full_name || '',
          specialty: doctorData.specialty || '',
          phone: doctorData.phone || '',
          bio: doctorData.bio || ''
        })
      }

    } catch (error) {
      console.error('Error fetching doctor data:', error)
      setError('Something went wrong loading your account')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimeSlots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: slotsData, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .order('slot_date', { ascending: true })

      if (slotsError) {
        console.error('Slots fetch error:', slotsError)
        return
      }

      setTimeSlots(slotsData || [])
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          ...data,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        setError('Error updating profile')
        console.error(updateError)
      } else {
        setMessage('Profile updated successfully!')
        setDoctor(prev => prev ? { ...prev, ...data, profile_completed: true } : null)
        
        // If this was first-time profile setup, redirect to dashboard after delay
        if (!doctor?.profile_completed) {
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const onSlotSubmit = async (data: TimeSlotForm) => {
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: insertError } = await supabase
        .from('time_slots')
        .insert({
          doctor_id: user.id,
          slot_date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          is_available: true,
          is_booked: false
        })

      if (insertError) {
        setError('Error adding time slot')
        console.error(insertError)
      } else {
        setMessage('Time slot added successfully!')
        slotForm.reset()
        fetchTimeSlots()
      }
    } catch (error) {
      console.error('Error adding time slot:', error)
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', slotId)

      if (deleteError) {
        console.error('Error deleting slot:', deleteError)
        setError('Error deleting slot')
      } else {
        fetchTimeSlots()
        setMessage('Time slot deleted')
      }
    } catch (error) {
      console.error('Error deleting slot:', error)
    }
  }

  const copyBookingLink = () => {
    const link = `https://quickslot.com/${doctor?.username}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account...</p>
        </div>
      </div>
    )
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchDoctorData} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setError('')
                  setActiveTab('profile')
                  // Try to continue anyway - maybe we can create the profile
                }} 
                className="w-full"
              >
                Go to Accounts Page
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-4">👤</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Account not found</h2>
            <p className="text-gray-600 mb-4">We couldn&apos;t find your account information.</p>
            <Button onClick={() => router.push('/signin')} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
                <span>/</span>
                <span>Account Settings</span>
              </div>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h2>
          <p className="text-gray-600">Manage your profile and appointment slots</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 inline mr-2" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('slots')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'slots'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5 inline mr-2" />
                Time Slots
              </button>
            </nav>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-gray-600">This information will be visible to your patients</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      {...profileForm.register('full_name')}
                      placeholder="Dr. John Smith"
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-sm text-red-600">{profileForm.formState.errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty *</Label>
                    <Input
                      id="specialty"
                      {...profileForm.register('specialty')}
                      placeholder="Cardiologist"
                    />
                    {profileForm.formState.errors.specialty && (
                      <p className="text-sm text-red-600">{profileForm.formState.errors.specialty.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...profileForm.register('phone')}
                    placeholder="+91 98765 43210"
                  />
                  {profileForm.formState.errors.phone && (
                    <p className="text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    {...profileForm.register('bio')}
                    rows={4}
                    placeholder="Tell patients about your experience, qualifications, and approach to care..."
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-sm text-red-600">{profileForm.formState.errors.bio.message}</p>
                  )}
                </div>

                {/* Booking Link */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium text-gray-700">Your Booking Link</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={`https://quickslot.com/${doctor.username}`}
                        readOnly
                        className="flex-1 bg-white"
                      />
                      <Button
                        type="button"
                        onClick={copyBookingLink}
                        variant="outline"
                        size="sm"
                      >
                        {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Share this link with your patients for booking</p>
                  </CardContent>
                </Card>

                <Button type="submit" disabled={isSaving} size="lg">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Time Slots Tab */}
        {activeTab === 'slots' && (
          <div className="space-y-8">
            {/* Add New Slot Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Time Slot</CardTitle>
                <p className="text-sm text-gray-600">Create new appointment slots for patients to book</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={slotForm.handleSubmit(onSlotSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        {...slotForm.register('date')}
                      />
                      {slotForm.formState.errors.date && (
                        <p className="text-sm text-red-600">{slotForm.formState.errors.date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        {...slotForm.register('startTime')}
                      />
                      {slotForm.formState.errors.startTime && (
                        <p className="text-sm text-red-600">{slotForm.formState.errors.startTime.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        {...slotForm.register('endTime')}
                      />
                      {slotForm.formState.errors.endTime && (
                        <p className="text-sm text-red-600">{slotForm.formState.errors.endTime.message}</p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slot
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Slots */}
            <Card>
              <CardHeader>
                <CardTitle>Your Time Slots</CardTitle>
                <p className="text-sm text-gray-600">Manage your existing appointment slots</p>
              </CardHeader>
              <CardContent>
                {timeSlots.length > 0 ? (
                  <div className="space-y-3">
                    {timeSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{slot.slot_date}</p>
                            <p className="text-gray-600">{slot.start_time} - {slot.end_time}</p>
                          </div>
                          <Badge variant={slot.is_booked ? "destructive" : "secondary"}>
                            {slot.is_booked ? 'Booked' : 'Available'}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => deleteSlot(slot.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No time slots created yet</p>
                    <p className="text-sm text-gray-400">Add your first time slot above to start accepting bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}