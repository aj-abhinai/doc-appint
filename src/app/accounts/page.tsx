// src/app/accounts/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, User, Clock, Save, ArrowLeft, Plus, Trash2, Copy, Check } from 'lucide-react'
import { supabase, Doctor, TimeSlot } from '@/lib/supabase'

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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const router = useRouter()

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  })

  const slotForm = useForm<TimeSlotForm>({
    resolver: zodResolver(timeSlotSchema)
  })


  const fetchDoctorData = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single()

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
    }
  }, [profileForm, router])

  useEffect(() => {
    fetchDoctorData()
  }, [fetchDoctorData])

  useEffect(() => {
    if (activeTab === 'slots') {
      fetchTimeSlots()
    }
  }, [activeTab])


  const fetchTimeSlots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: slotsData } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .order('slot_date', { ascending: true })

      setTimeSlots(slotsData || [])
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsSaving(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('doctors')
        .update({
          ...data,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        setMessage('Error updating profile')
        console.error(error)
      } else {
        setMessage('Profile updated successfully!')
        // Ensure required Doctor fields are always strings
        setDoctor({
          ...doctor,
          ...data,
          profile_completed: true,
          id: doctor?.id || '',
          email: doctor?.email || '',
          username: doctor?.username || '',
          tier: doctor?.tier || 'free',
          created_at: doctor?.created_at || '',
          updated_at: new Date().toISOString(),
        })
        // If this was first-time profile setup, redirect to dashboard
        if (!doctor?.profile_completed) {
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const onSlotSubmit = async (data: TimeSlotForm) => {
    setIsLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('time_slots')
        .insert({
          doctor_id: user.id,
          slot_date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          is_available: true,
          is_booked: false
        })

      if (error) {
        setMessage('Error adding time slot')
        console.error(error)
      } else {
        setMessage('Time slot added successfully!')
        slotForm.reset()
        fetchTimeSlots()
      }
    } catch (error) {
      console.error('Error adding time slot:', error)
      setMessage('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', slotId)

      if (error) {
        console.error('Error deleting slot:', error)
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

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db2777] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account...</p>
        </div>
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
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-[#db2777] transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
                <span>/</span>
                <span>Account Settings</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#db2777] rounded-lg flex items-center justify-center">
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
                    ? 'border-[#db2777] text-[#db2777]'
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
                    ? 'border-[#db2777] text-[#db2777]'
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
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Information</h3>
              <p className="text-gray-600">This information will be visible to your patients</p>
            </div>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...profileForm.register('full_name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                    placeholder="Dr. John Smith"
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialty *
                  </label>
                  <input
                    type="text"
                    {...profileForm.register('specialty')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                    placeholder="Cardiologist"
                  />
                  {profileForm.formState.errors.specialty && (
                    <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.specialty.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...profileForm.register('phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                  placeholder="+91 98765 43210"
                />
                {profileForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  {...profileForm.register('bio')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                  placeholder="Tell patients about your experience, qualifications, and approach to care..."
                />
                {profileForm.formState.errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.bio.message}</p>
                )}
              </div>

              {/* Booking Link */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Booking Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`https://quickslot.com/${doctor.username}`}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={copyBookingLink}
                    className="px-4 py-2 bg-[#db2777] text-white rounded-lg hover:bg-[#be185d] transition-colors flex items-center"
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Share this link with your patients for booking</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#db2777] hover:bg-[#be185d] disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Time Slots Tab */}
        {activeTab === 'slots' && (
          <div className="space-y-8">
            {/* Add New Slot Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Time Slot</h3>
                <p className="text-gray-600">Create new appointment slots for patients to book</p>
              </div>

              <form onSubmit={slotForm.handleSubmit(onSlotSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      {...slotForm.register('date')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                    />
                    {slotForm.formState.errors.date && (
                      <p className="mt-1 text-sm text-red-600">{slotForm.formState.errors.date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      {...slotForm.register('startTime')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                    />
                    {slotForm.formState.errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{slotForm.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      {...slotForm.register('endTime')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-[#db2777] transition-colors"
                    />
                    {slotForm.formState.errors.endTime && (
                      <p className="mt-1 text-sm text-red-600">{slotForm.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#db2777] hover:bg-[#be185d] disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add Slot
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Existing Slots */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Time Slots</h3>
                <p className="text-gray-600">Manage your existing appointment slots</p>
              </div>

              {timeSlots.length > 0 ? (
                <div className="space-y-3">
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{slot.slot_date}</p>
                          <p className="text-gray-600">{slot.start_time} - {slot.end_time}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.is_booked 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {slot.is_booked ? 'Booked' : 'Available'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}