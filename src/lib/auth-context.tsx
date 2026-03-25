'use client'

import { createContext, useContext, useState } from 'react'
import { Profile } from './types'

// Mock user for no-auth mode - simplified object
const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
}

const MOCK_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'User',
  email: 'user@example.com',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

interface AuthContextType {
  user: typeof MOCK_USER | null
  profile: Profile | null
  session: null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: null }>
  signIn: (email: string, password: string) => Promise<{ error: null; session: null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always authenticated mode - no login required
  const [user] = useState<typeof MOCK_USER | null>(MOCK_USER)
  const [profile] = useState<Profile | null>(MOCK_PROFILE)
  const [session] = useState<null>(null)
  const [loading] = useState(false)

  // No-op auth functions
  const signUp = async () => ({ error: null })
  const signIn = async () => ({ error: null, session: null })
  const signOut = async () => {}

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
