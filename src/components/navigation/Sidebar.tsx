import {
  BarChart3,
  BookOpenText,
  ClipboardList,
  FileSearch,
  Map,
} from 'lucide-react'
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
  'Investigation Brief': ClipboardList,
  Evidence: FileSearch,
  'Data & Methodology': BookOpenText,
}

export function Sidebar({ activePage, items, onNavigate }: SidebarProps) {
  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:left-0 lg:top-[4.25rem] lg:h-[calc(100vh-4.25rem)] lg:w-60 lg:border-b-0 lg:border-r">
      <nav
        aria-label="Primary"
        className="overflow-x-auto px-3 py-2 sm:px-6 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:px-4 lg:py-6"
      >
        <div className="flex min-w-max gap-1.5 lg:min-w-0 lg:flex-col lg:gap-1.5">
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
          <p className="font-semibold text-slate-700">NISR source coverage</p>
          <p className="mt-1">SAS 2024 · SAS 2025 · AHS 2024</p>
          <p>Published observations with source links</p>
        </div>
      </nav>
    </aside>
  )
}
