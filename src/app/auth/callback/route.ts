// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // const next = requestUrl.searchParams.get('next') ?? '/accounts'

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange the code for a session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Auth callback session error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/signin?error=auth_error`)
      }

      if (sessionData?.user) {
        // Check if doctor record exists
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, username, profile_completed')
          .eq('id', sessionData.user.id)
          .single()

        if (doctorError && doctorError.code === 'PGRST116') {
          // Doctor record doesn't exist, create one
          const username = sessionData.user.user_metadata?.username || 
                          sessionData.user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') ||
                          `user-${sessionData.user.id.slice(0, 8)}`

          const { error: createError } = await supabase
            .from('doctors')
            .insert({
              id: sessionData.user.id,
              email: sessionData.user.email || '',
              username: username,
              tier: 'free',
              profile_completed: false
            })

          if (createError) {
            console.error('Error creating doctor record:', createError)
            return NextResponse.redirect(`${requestUrl.origin}/signin?error=setup_error`)
          }

          // New user, go to accounts page to complete profile
          return NextResponse.redirect(`${requestUrl.origin}/accounts?welcome=true`)
        }

        // Existing user, redirect based on profile completion
        if (doctorData?.profile_completed) {
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        } else {
          return NextResponse.redirect(`${requestUrl.origin}/accounts?complete=true`)
        }
      }

    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/signin?error=callback_error`)
    }
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/signin`)
}