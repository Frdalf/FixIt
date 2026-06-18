'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Inactivity timeout effect
  useEffect(() => {
    if (!user) return

    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      // 1 hour = 3600000 ms
      timeoutId = setTimeout(() => {
        const role = profile?.role
        signOut()
        if (role === 'admin') {
          window.location.href = '/admin/login?expired=true'
        } else if (role === 'teknisi') {
          window.location.href = '/teknisi/login?expired=true'
        } else {
          window.location.href = '/login?expired=true'
        }
      }, 3600000)
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']
    
    // Throttle the event listeners to reduce performance impact
    let isThrottled = false
    const handleActivity = () => {
      if (!isThrottled) {
        resetTimer()
        isThrottled = true
        setTimeout(() => { isThrottled = false }, 1000) // update timer at most once a second
      }
    }

    resetTimer()
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))

    return () => {
      clearTimeout(timeoutId)
      events.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [user])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
