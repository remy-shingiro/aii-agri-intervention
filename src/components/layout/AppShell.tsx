import type { ReactNode } from 'react'

import { Navigation } from '../navigation/Navigation'
import { type NavigationItem } from '../navigation/navigation.types'

const PRODUCT_NAME = 'Agricultural Intervention Intelligence'
const PRODUCT_LABEL = 'NISR / TRACK 01'

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
    <div className="min-h-screen overflow-hidden bg-[#f5f3ed] text-[#18312c]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#18312c]/15 py-6">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => onNavigate('Overview')}
            type="button"
          >
            <span className="grid size-10 place-items-center rounded-full bg-[#d95d39] font-mono text-sm font-bold text-[#fdfbf5]">
              AI
            </span>

            <span>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d95d39]">
                {PRODUCT_LABEL}
              </span>

              <span className="block font-display text-lg font-semibold tracking-tight">
                {PRODUCT_NAME}
              </span>
            </span>
          </button>

          <span className="hidden rounded-full border border-[#18312c]/20 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] sm:block">
            Foundation build
          </span>
        </header>

        <div className="grid flex-1 lg:grid-cols-[220px_1fr] lg:gap-16">
          <Navigation
            activePage={activePage}
            items={navigation}
            onNavigate={onNavigate}
          />

          <main className="py-12 lg:py-20">{children}</main>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[#18312c]/15 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#18312c]/50 sm:flex-row sm:items-center sm:justify-between">
          <span>Static frontend / explainable by default</span>
          <span>AHS + SAS source validation required before analysis</span>
        </footer>
      </div>
    </div>
  )
}