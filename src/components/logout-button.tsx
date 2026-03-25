'use client'

import { useAuth } from '@/lib/auth-context'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton() {
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await signOut()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm sm:text-base disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
      ) : (
        <>
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </>
      )}
    </button>
  )
}
