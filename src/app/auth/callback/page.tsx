'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { getErrorMessage, showErrorWarning } from '@/lib/error-utils'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        const message = getErrorMessage(error, 'Failed to complete sign in.')
        setError(message)
        showErrorWarning(message)
        return
      }

      if (session) {
        router.push('/')
      } else {
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="max-w-md rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <p className="mb-3">{error}</p>
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Return to sign in
            </Link>
          </div>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}
