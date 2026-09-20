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
    <div className="min-h-screen">
      <Navbar />

      <Sidebar
        activePage={activePage}
        items={navigation}
        onNavigate={onNavigate}
      />

      <div className="min-h-[calc(100vh-5rem)] lg:pl-64">
        <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1500px] px-4 sm:px-8 lg:px-12">
          <main className="py-8 sm:py-12 lg:py-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
