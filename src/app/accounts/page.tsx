// src/app/accounts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, User, Clock, Save, ArrowLeft, Plus, Trash2, Copy, Check, RefreshCw } from 'lucide-react'
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

const scheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  interval_minutes: z.number().min(5).max(30)
})

type ScheduleForm = z.infer<typeof scheduleSchema>

interface RecurringSchedule {
  id: string
  name: string
  weekdays: number[]
  start_time: string
  end_time: string
  interval_minutes: number
  is_active: boolean
  created_at: string
}

const WEEKDAYS = [
  { value: 0, label: 'Sun', full: 'Sunday' },
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' }
]

const INTERVAL_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 25, label: '25 minutes' },
  { value: 30, label: '30 minutes' }
]

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'schedules'>('profile')
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const router = useRouter()

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  })

  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      interval_minutes: 10
    }
  })

  useEffect(() => {
    const loadData = async () => {
      await fetchDoctorData()
    }
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'schedules') {
      fetchRecurringSchedules()
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

  const fetchRecurringSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('recurring_schedules')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: true })

      if (schedulesError) {
        console.error('Schedules fetch error:', schedulesError)
        return
      }

      setRecurringSchedules(schedulesData || [])
    } catch (error) {
      console.error('Error fetching recurring schedules:', error)
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
        .gte('slot_date', new Date().toISOString().split('T')[0])
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true })

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

  const onScheduleSubmit = async (data: ScheduleForm) => {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if at least one weekday is selected
      if (selectedWeekdays.length === 0) {
        setError('Please select at least one day')
        setIsSaving(false)
        return
      }

      // Validate end time is after start time
      if (data.start_time >= data.end_time) {
        setError('End time must be after start time')
        setIsSaving(false)
        return
      }

      const { error: insertError } = await supabase
        .from('recurring_schedules')
        .insert({
          doctor_id: user.id,
          name: data.name,
          weekdays: selectedWeekdays,
          start_time: data.start_time,
          end_time: data.end_time,
          interval_minutes: data.interval_minutes,
          is_active: true
        })

      if (insertError) {
        setError('Error adding schedule')
        console.error(insertError)
      } else {
        setMessage('Schedule added successfully!')
        scheduleForm.reset({
          name: '',
          start_time: '',
          end_time: '',
          interval_minutes: 10
        })
        setSelectedWeekdays([])
        fetchRecurringSchedules()
      }
    } catch (error) {
      console.error('Error adding schedule:', error)
      setError('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const generateSlots = async () => {
    setIsGenerating(true)
    setMessage('')
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.rpc('generate_slots_from_schedules', {
        doctor_uuid: user.id,
        days_ahead: 15
      })

      if (error) {
        console.error('Error generating slots:', error)
        setError('Failed to generate slots')
      } else {
        setMessage(`Successfully generated ${data || 0} appointment slots for the next 15 days!`)
        fetchTimeSlots()
      }
    } catch (error) {
      console.error('Error generating slots:', error)
      setError('Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('recurring_schedules')
        .delete()
        .eq('id', scheduleId)

      if (deleteError) {
        console.error('Error deleting schedule:', deleteError)
        setError('Error deleting schedule')
      } else {
        fetchRecurringSchedules()
        setMessage('Schedule deleted')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const toggleWeekday = (weekday: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(weekday) 
        ? prev.filter(d => d !== weekday)
        : [...prev, weekday].sort()
    )
  }

  const copyBookingLink = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://quick-doc-slot.vercel.app'}/${doctor?.username}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const formatWeekdays = (weekdays: number[]) => {
    return weekdays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', ')
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
          <p className="text-gray-600">Manage your profile and appointment schedules</p>
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
                onClick={() => setActiveTab('schedules')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedules'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5 inline mr-2" />
                Appointment Schedules
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
                        value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://quick-doc-slot.vercel.app'}/${doctor.username}`}
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

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-8">
            {/* Add New Schedule Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Recurring Schedule</CardTitle>
                <p className="text-sm text-gray-600">Set up your weekly appointment schedule with custom time ranges and intervals</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Schedule Name *</Label>
                    <Input
                      id="name"
                      {...scheduleForm.register('name')}
                      placeholder="e.g., Morning Hours, Evening Clinic"
                    />
                    {scheduleForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{scheduleForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Select Days *</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(day => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={selectedWeekdays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleWeekday(day.value)}
                          className="h-10 px-4"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    {error === 'Please select at least one day' && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        {...scheduleForm.register('start_time')}
                      />
                      {scheduleForm.formState.errors.start_time && (
                        <p className="text-sm text-red-600">{scheduleForm.formState.errors.start_time.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        {...scheduleForm.register('end_time')}
                      />
                      {scheduleForm.formState.errors.end_time && (
                        <p className="text-sm text-red-600">{scheduleForm.formState.errors.end_time.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interval">Appointment Interval *</Label>
                      <select
                        {...scheduleForm.register('interval_minutes', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        {INTERVAL_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {scheduleForm.formState.errors.interval_minutes && (
                        <p className="text-sm text-red-600">{scheduleForm.formState.errors.interval_minutes.message}</p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSaving || selectedWeekdays.length === 0}
                    className="w-full md:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Schedule...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Schedule
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Schedules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Recurring Schedules</CardTitle>
                    <p className="text-sm text-gray-600">Manage your weekly appointment schedules</p>
                  </div>
                  <Button
                    onClick={generateSlots}
                    disabled={isGenerating || recurringSchedules.length === 0}
                    variant="outline"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate Slots (15 days)
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recurringSchedules.length > 0 ? (
                  <div className="space-y-4">
                    {recurringSchedules.map((schedule) => (
                      <div key={schedule.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-900">{schedule.name}</h3>
                              <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                {schedule.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Days:</span> {formatWeekdays(schedule.weekdays)}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {schedule.start_time} - {schedule.end_time}
                              </div>
                              <div>
                                <span className="font-medium">Interval:</span> {schedule.interval_minutes} minutes
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteSchedule(schedule.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No recurring schedules created yet</p>
                    <p className="text-sm text-gray-400">Create your first schedule above to start generating appointment slots automatically</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Slots Preview */}
            {timeSlots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Appointment Slots</CardTitle>
                  <p className="text-sm text-gray-600">Preview of your upcoming appointment slots (next 15 days)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {timeSlots.slice(0, 20).map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {new Date(slot.slot_date + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-gray-600">{slot.start_time} - {slot.end_time}</p>
                          </div>
                          <Badge variant={slot.is_booked ? "destructive" : "secondary"}>
                            {slot.is_booked ? 'Booked' : 'Available'}
                          </Badge>
                        </div>
                        {slot.duration_minutes && (
                          <div className="text-xs text-gray-500">
                            {slot.duration_minutes} min
                          </div>
                        )}
                      </div>
                    ))}
                    {timeSlots.length > 20 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          Showing 20 of {timeSlots.length} slots
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}