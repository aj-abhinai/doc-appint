// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database
export interface Doctor {
  id: string
  email: string
  username: string
  full_name?: string
  specialty?: string
  phone?: string
  bio?: string
  tier: 'free' | 'basic' | 'pro'
  subscription_start?: string
  subscription_end?: string
  created_at: string
  updated_at: string
  profile_completed: boolean
}

export interface TimeSlot {
  id: string
  doctor_id: string
  slot_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_available: boolean
  is_booked: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
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
  time_slot?: Partial<TimeSlot>
}