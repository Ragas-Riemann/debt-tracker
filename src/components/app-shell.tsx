'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
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
  )
}
