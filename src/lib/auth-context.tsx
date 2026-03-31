'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Profile } from './types'
import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'
import { getErrorMessage } from './error-utils'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.warn('Failed to load profile', error)
    return null
  }

  return data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: authSession } = await supabase.auth.getSession()
      setSession(authSession.session || null)
      setUser(authSession.session?.user || null)

      if (authSession.session?.user) {
        const profileData = await fetchProfile(authSession.session.user.id)
        setProfile(profileData)
      }

      setLoading(false)
    }

    initializeAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user || null)

      if (currentSession?.user) {
        const profileData = await fetchProfile(currentSession.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      // Rely on the `handle_new_user` trigger in Supabase to create the profile.
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return { error }
      return { error: null }
    } catch (error) {
      return { error: new Error(getErrorMessage(error, 'Sign up failed.')) }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error }

      if (data.session?.user) {
        const profileData = await fetchProfile(data.session.user.id)
        setProfile(profileData)
      }

      return { error: null }
    } catch (error) {
      return { error: new Error(getErrorMessage(error, 'Sign in failed.')) }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
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
