import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Map,
} from 'lucide-react'

import { SidebarNavItem } from './SidebarNavItem'
import type { NavigationItem } from './navigation.types'

interface SidebarProps {
  activePage: NavigationItem
  items: readonly NavigationItem[]
  onNavigate: (page: NavigationItem) => void
}

const navigationIcons: Record<NavigationItem, typeof Map> = {
  Overview: BarChart3,
  'District Profile': Map,
  Evidence: ClipboardList,
  'Data & Methodology': BookOpen,
}

export function Sidebar({
  activePage,
  items,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:left-0 lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-56 lg:border-b-0 lg:border-r">
      <nav
        aria-label="Primary"
        className="overflow-x-auto px-4 py-3 sm:px-6 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:px-4 lg:py-6"
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

        <div className="hidden lg:mt-auto lg:block lg:pt-6">
          <div className="overflow-hidden rounded-xl bg-green-50">
            <div className="flex h-20 items-end justify-center bg-green-100">
              <div
                aria-hidden="true"
                className="h-12 w-full rounded-t-[50%] bg-green-200"
              />
            </div>

            <div className="space-y-2 p-3.5">
              <h2 className="text-sm font-bold leading-5 text-slate-900">
                From official statistics to informed decisions
              </h2>

              <p className="text-xs leading-5 text-slate-500">
                Using NISR agricultural data to identify where attention is
                needed most.
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}
