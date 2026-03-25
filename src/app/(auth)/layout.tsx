import { AuthProvider } from '@/lib/auth-context'

export const metadata = {
  title: 'Debt Tracker - Auth',
  description: 'Sign in to Debt Tracker',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {children}
      </div>
    </AuthProvider>
  )
}
