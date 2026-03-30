'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, User, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function EditDebtorPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && params.id) {
      fetchDebtor()
    }
  }, [user, authLoading, params.id, router])

  async function fetchDebtor() {
    try {
      const { data, error } = await supabase
        .from('debtors')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      if (!data) {
        router.push('/debtors')
        return
      }

      setFormData({
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        notes: data.notes || '',
      })
      setAvatarUrl(data.avatar_url)
    } catch (error) {
      console.error('Error fetching debtor:', error)
      router.push('/debtors')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let newAvatarUrl = avatarUrl

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) newAvatarUrl = uploadedUrl
      }

      const { error } = await supabase
        .from('debtors')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
          avatar_url: newAvatarUrl,
        })
        .eq('id', params.id)

      if (error) throw error

      router.push(`/debtors/${params.id}`)
    } catch (error) {
      console.error('Error updating debtor:', error)
      alert('Failed to update debtor. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this debtor and all their debts? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('debtors')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/debtors')
    } catch (error) {
      console.error('Error deleting debtor:', error)
      alert('Failed to delete debtor')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Link
          href={`/debtors/${params.id}`}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Link>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Edit Debtor</h1>
          <p className="text-gray-600 mt-1">Update debtor information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div
              className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                  <Upload className="w-5 h-5 text-gray-500 mt-1" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-sm text-gray-600 mt-2">Click to change profile picture</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="label">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="input"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="input"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </button>
            <Link
              href={`/debtors/${params.id}`}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
