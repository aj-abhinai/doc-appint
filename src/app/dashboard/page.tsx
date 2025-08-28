// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, Settings, Plus, ExternalLink } from 'lucide-react'
import { supabase, Doctor } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/loading'

interface AppointmentWithSlot {
  id: string
  slot_id: string
  doctor_id: string
  patient_name: string
  patient_phone: string
  patient_email?: string
  appointment_date: string
  appointment_time: string
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  patient_notes?: string
  doctor_notes?: string
  created_at: string
  updated_at: string
  time_slots?: {
    slot_date: string
    start_time: string
    end_time: string
  }
}

export default function DashboardPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<AppointmentWithSlot[]>([])
  const [stats, setStats] = useState({
    todayAppointments: 0,
    thisWeekAppointments: 0,
    totalSlots: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch doctor info
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setDoctor(doctorData)

      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Get start of this week (Sunday)
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const weekStart = startOfWeek.toISOString().split('T')[0]

      // Fetch today's appointments
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('appointment_date', today)
        .eq('status', 'confirmed')

      // Fetch this week's appointments
      const { data: weekAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', user.id)
        .gte('appointment_date', weekStart)
        .eq('status', 'confirmed')

      // Fetch available slots (future dates only)
      const { data: availableSlots } = await supabase
        .from('time_slots')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('is_available', true)
        .eq('is_booked', false)
        .gte('slot_date', today)

      // Fetch recent appointments with slot details  
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select(`
          *,
          time_slots!inner(slot_date, start_time, end_time)
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(5)

      setAppointments(appointmentData || [])

      // Set real stats
      setStats({
        todayAppointments: todayAppointments?.length || 0,
        thisWeekAppointments: weekAppointments?.length || 0,
        totalSlots: availableSlots?.length || 0
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!doctor) {
    return <PageLoading text="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Quick Slot</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
                <span>/</span>
                <span>Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/accounts"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden md:inline">Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {doctor.full_name || 'Doctor'}! 👋
          </h2>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your appointments today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today&apos;s Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeekAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Slots</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSlots}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                <Link href="/appointments" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600">{appointment.patient_phone}</p>
                        {appointment.patient_notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{appointment.patient_notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.time_slots?.slot_date ? 
                            new Date(appointment.time_slots.slot_date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            }) : 
                            appointment.appointment_date
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.time_slots?.start_time || appointment.appointment_time}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No appointments yet</p>
                  <p className="text-sm text-gray-400">Your recent bookings will appear here</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/accounts">Create Time Slots</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              <Link
                href="/accounts"
                className="flex items-center justify-between p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Add Time Slots</p>
                    <p className="text-sm text-gray-600">Create new appointment slots</p>
                  </div>
                </div>
                <div className="text-primary group-hover:translate-x-1 transition-transform">→</div>
              </Link>

              <Link
                href="/accounts"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Account Settings</p>
                    <p className="text-sm text-gray-600">Manage your profile and preferences</p>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:translate-x-1 transition-transform">→</div>
              </Link>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Your Booking Page</p>
                    <p className="text-sm text-gray-600">quickslot.com/{doctor.username}</p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}