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
      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
        active
          ? 'bg-green-50 text-green-800'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={`size-5 shrink-0 ${
          active ? 'text-green-700' : 'text-slate-500'
        }`}
        strokeWidth={1.8}
      />

      <span>{label}</span>
    </button>
  )
}