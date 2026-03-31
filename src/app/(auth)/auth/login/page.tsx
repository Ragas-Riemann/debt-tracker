'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'
import { getErrorMessage, showErrorWarning } from '@/lib/error-utils'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!loading && user) {
    router.push('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        showErrorWarning(error.message)
        return
      }

      router.push('/dashboard')
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to sign in right now.')
      setError(message)
      showErrorWarning(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Don&rsquo;t have an account?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
