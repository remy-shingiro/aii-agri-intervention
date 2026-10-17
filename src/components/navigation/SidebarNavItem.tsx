import type { LucideIcon } from 'lucide-react'

import type { NavigationItem } from './navigation.types'

interface SidebarNavItemProps {
  icon: LucideIcon
  label: NavigationItem
  active: boolean
  onClick: () => void
}

export function SidebarNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2 lg:min-h-11 lg:gap-3 lg:px-3.5 ${
        active
          ? 'bg-forest-950 text-white shadow-sm'
          : 'text-slate-600 hover:bg-sage-50 hover:text-forest-950'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={`size-4 shrink-0 lg:size-[18px] ${
          active ? 'text-white' : 'text-slate-500'
        }`}
        strokeWidth={1.8}
      />

      <span>{label}</span>
    </button>
  )
}
