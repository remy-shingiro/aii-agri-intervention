import { BarChart3, BookOpenText, FileSearch, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SidebarNavItem } from './SidebarNavItem'
import type { NavigationItem } from './navigation.types'

interface SidebarProps {
  activePage: NavigationItem
  items: readonly NavigationItem[]
  onNavigate: (page: NavigationItem) => void
}

const navigationIcons: Record<NavigationItem, LucideIcon> = {
  Overview: BarChart3,
  'District Profile': Map,
  Evidence: FileSearch,
  'Data & Methodology': BookOpenText,
}

export function Sidebar({ activePage, items, onNavigate }: SidebarProps) {
  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:left-0 lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-64 lg:border-b-0 lg:border-r">
      <nav
        aria-label="Primary"
        className="overflow-x-auto px-4 py-2.5 sm:px-6 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:px-4 lg:py-6"
      >
        <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:gap-2">
          {items.map((item) => (
            <SidebarNavItem
              active={activePage === item}
              icon={navigationIcons[item]}
              key={item}
              label={item}
              onClick={() => onNavigate(item)}
            />
          ))}
        </div>

        <div className="hidden border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 lg:mt-auto lg:block">
          <p className="font-semibold text-slate-700">Connected evidence</p>
          <p className="mt-1">NISR Seasonal Agricultural Survey 2025</p>
          <p>Season A · Agricultural year 2024/25</p>
        </div>
      </nav>
    </aside>
  )
}
