import type { ReactNode } from 'react'

import { Navbar } from '../navigation/Navbar'
import { Sidebar } from '../navigation/Sidebar'
import { type NavigationItem } from '../navigation/navigation.types'

interface AppShellProps {
  activePage: NavigationItem
  children: ReactNode
  navigation: readonly NavigationItem[]
  onNavigate: (page: NavigationItem) => void
}

export function AppShell({
  activePage,
  children,
  navigation,
  onNavigate,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-md"
        href="#main-content"
      >
        Skip to main content
      </a>
      <Navbar />

      <Sidebar
        activePage={activePage}
        items={navigation}
        onNavigate={onNavigate}
      />

      <div className="min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] lg:pl-64">
        <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1500px] px-4 py-7 sm:px-8 sm:py-10 lg:min-h-[calc(100vh-5rem)] lg:px-10 lg:py-12">
          <main id="main-content" className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
