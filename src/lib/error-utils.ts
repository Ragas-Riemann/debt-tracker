export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  if (typeof error === 'string') return error

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage
    }
  }

  return fallback
}

export function validateImageFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSizeInBytes = 5 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid image (JPG, PNG, WEBP, or GIF).'
  }

  if (file.size > maxSizeInBytes) {
    return 'Image is too large. Maximum size is 5MB.'
  }

  return null
}

export function showErrorWarning(message: string) {
  if (typeof window === 'undefined') return
  window.alert(message)
}
