'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, loading, user } = useAuth()

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

    const { error } = await signUp(email, password)
    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Create account</h1>
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
            minLength={8}
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
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
