// src/app/[username]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, User, Phone, CheckCircle } from 'lucide-react'
import { supabase, Doctor, TimeSlot } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const bookingSchema = z.object({
  patient_name: z.string().min(2, 'Name must be at least 2 characters'),
  patient_phone: z.string().min(10, 'Please enter a valid phone number'),
  patient_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  patient_notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
})

type BookingForm = z.infer<typeof bookingSchema>

interface TimeSlotWithDate extends TimeSlot {
  formatted_date: string
  formatted_time: string
}

export default function PatientBookingPage() {
  const params = useParams()
  const username = params.username as string
  
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithDate[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotWithDate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingDetails, setBookingDetails] = useState<{
    id: string
    patient_name: string
    patient_phone: string
    doctor_name: string
    doctor_specialty: string
    formatted_date: string
    formatted_time: string
  } | null>(null)

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema)
  })

  // Move fetchDoctorAndSlots to component scope so it can be called from anywhere
  const fetchDoctorAndSlots = async () => {
    try {
      setIsLoading(true)
      setError('')

      console.log('Looking for doctor with username:', username)

      // Fetch doctor by username
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('username', username)
        .single()

      console.log('Doctor query result:', { doctorData, doctorError })

      if (doctorError || !doctorData) {
        console.error('Doctor not found:', doctorError)
        setError(`Doctor with username "${username}" not found. Please check the URL.`)
        setIsLoading(false)
        return
      }

      setDoctor(doctorData)

      // Fetch available time slots for the next 30 days
      const today = new Date().toISOString().split('T')[0]
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const { data: slotsData, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', doctorData.id)
        .eq('is_available', true)
        .eq('is_booked', false)
        .gte('slot_date', today)
        .lte('slot_date', thirtyDaysLater)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (slotsError) {
        console.error('Error fetching slots:', slotsError)
        setError('Unable to load available appointments.')
        setIsLoading(false)
        return
      }

      // Format slots with readable dates and times
      const formattedSlots: TimeSlotWithDate[] = (slotsData || []).map(slot => ({
        ...slot,
        formatted_date: new Date(slot.slot_date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        formatted_time: `${slot.start_time} - ${slot.end_time}`
      }))

      setTimeSlots(formattedSlots)

    } catch (error) {
      console.error('Error loading doctor page:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (username) {
      fetchDoctorAndSlots()
    }
  }, [username])

  const onSubmit = async (data: BookingForm) => {
    if (!selectedSlot || !doctor) return

    setIsBooking(true)
    setError('')

    try {
      // Create appointment
      const appointmentData = {
        slot_id: selectedSlot.id,
        doctor_id: doctor.id,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: data.patient_email || null,
        appointment_date: selectedSlot.slot_date,
        appointment_time: selectedSlot.start_time,
        status: 'confirmed',
        patient_notes: data.patient_notes || null
      }

      const { data: appointmentResult, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single()

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
        if (appointmentError.code === '23505') {
          setError('This time slot is no longer available. Please choose another time.')
        } else {
          setError('Failed to book appointment. Please try again.')
        }
        return
      }

      // Success! Store booking details and show confirmation
      setBookingDetails({
        ...appointmentResult,
        doctor_name: doctor.full_name,
        doctor_specialty: doctor.specialty,
        formatted_date: selectedSlot.formatted_date,
        formatted_time: selectedSlot.formatted_time
      })
      setSuccess(true)

      // Refresh slots to remove the booked one
      fetchDoctorAndSlots()

    } catch (error) {
      console.error('Booking error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    )
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Doctor Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">Please check the URL or contact your doctor for the correct booking link.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success && bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Confirmed!</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">{bookingDetails.doctor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{bookingDetails.formatted_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{bookingDetails.formatted_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{bookingDetails.patient_name}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-2">📱 You&apos;ll receive a confirmation call/message on {bookingDetails.patient_phone}</p>
              <p>⏰ Please arrive 10 minutes early for your appointment</p>
            </div>

            <Button 
              onClick={() => {
                setSuccess(false)
                setSelectedSlot(null)
                form.reset()
              }}
              variant="outline"
              className="w-full"
            >
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quick Slot</h1>
              <p className="text-sm text-gray-500">Book your appointment</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Doctor Profile */}
        <Card className="mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {doctor?.full_name || 'Doctor'}
                </h1>
                {doctor?.specialty && (
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                    <Badge variant="secondary" className="text-primary">
                      {doctor.specialty}
                    </Badge>
                  </div>
                )}
                {doctor?.phone && (
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-600 mb-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm sm:text-base">{doctor.phone}</span>
                  </div>
                )}
                {doctor?.bio && (
                  <p className="text-gray-600 mt-4 leading-relaxed text-sm sm:text-base">{doctor.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Available Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Available Appointments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No appointments available</p>
                  <p className="text-sm text-gray-400">Please contact the doctor directly or check back later</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{slot.formatted_date}</p>
                          <p className="text-sm text-gray-600">{slot.formatted_time}</p>
                        </div>
                        {selectedSlot?.id === slot.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Book Your Appointment</CardTitle>
              <p className="text-sm text-gray-600">
                {selectedSlot 
                  ? `Selected: ${selectedSlot.formatted_date} at ${selectedSlot.formatted_time}`
                  : 'Please select an appointment time first'
                }
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Full Name *</Label>
                  <Input
                    id="patient_name"
                    {...form.register('patient_name')}
                    placeholder="Enter your full name"
                    disabled={!selectedSlot}
                  />
                  {form.formState.errors.patient_name && (
                    <p className="text-sm text-red-600">{form.formState.errors.patient_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_phone">Phone Number *</Label>
                  <Input
                    id="patient_phone"
                    type="tel"
                    {...form.register('patient_phone')}
                    placeholder="+91 98765 43210"
                    disabled={!selectedSlot}
                  />
                  {form.formState.errors.patient_phone && (
                    <p className="text-sm text-red-600">{form.formState.errors.patient_phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_email">Email (Optional)</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    {...form.register('patient_email')}
                    placeholder="your.email@example.com"
                    disabled={!selectedSlot}
                  />
                  {form.formState.errors.patient_email && (
                    <p className="text-sm text-red-600">{form.formState.errors.patient_email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="patient_notes"
                    {...form.register('patient_notes')}
                    placeholder="Any specific concerns or notes for the doctor..."
                    rows={3}
                    disabled={!selectedSlot}
                  />
                  {form.formState.errors.patient_notes && (
                    <p className="text-sm text-red-600">{form.formState.errors.patient_notes.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={!selectedSlot || isBooking}
                  className="w-full"
                  size="lg"
                >
                  {isBooking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking Appointment...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By booking, you agree that the information provided is accurate and you will attend the scheduled appointment.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}