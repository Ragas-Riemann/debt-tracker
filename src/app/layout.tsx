import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'
import { AuthProvider } from '@/lib/auth-context'
import { LogoutButton } from '@/components/logout-button'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Debt Tracker',
  description: 'Track debts and debtors efficiently',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Debt Tracker',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
              <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex items-center justify-between h-16">
                  <Link href="/" className="text-xl font-bold text-primary-600">
                    Debt Tracker
                  </Link>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <Link
                      href="/"
                      className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                    >
                      <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link
                      href="/debtors"
                      className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Debtors</span>
                    </Link>
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </nav>
            <main className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
