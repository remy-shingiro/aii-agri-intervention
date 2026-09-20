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
    <div className="min-h-screen bg-[#f5f3ed] text-[#18312c]">
      <Navbar />

      <Sidebar
        activePage={activePage}
        items={navigation}
        onNavigate={onNavigate}
      />

      <div className="min-h-[calc(100vh-5rem)] lg:pl-64">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1500px] flex-col px-4 sm:px-8 lg:px-12">
          <main className="flex-1 py-8 sm:py-12 lg:py-20">
            {children}
          </main>

          <footer className="flex flex-col gap-2 border-t border-[#18312c]/15 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#18312c]/50 sm:flex-row sm:items-center sm:justify-between">
            <span>Static frontend / explainable by default</span>
            <span>AHS + SAS source validation required before analysis</span>
          </footer>
        </div>
      </div>
    </div>
  )
}