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
    <div className="min-h-screen bg-warm-50 text-slate-800">
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

      <div className="min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4.25rem)] lg:pl-60">
        <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1580px] px-4 py-6 sm:px-7 sm:py-8 lg:min-h-[calc(100vh-4.25rem)] lg:px-9 lg:py-9 xl:px-11">
          <main id="main-content" className="mx-auto min-w-0 max-w-[1440px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
