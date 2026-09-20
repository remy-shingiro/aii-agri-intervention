import type { NavigationItem } from './navigation.types'

interface NavigationProps {
  activePage: NavigationItem
  items: readonly NavigationItem[]
  onNavigate: (page: NavigationItem) => void
}

export function Navigation({
  activePage,
  items,
  onNavigate,
}: NavigationProps) {
  return (
    <nav
      aria-label="Primary"
      className="flex gap-2 overflow-x-auto border-b border-[#18312c]/15 py-4 lg:block lg:border-b-0 lg:border-r lg:py-12 lg:pr-8"
    >
      {items.map((item, index) => (
        <button
          className={`flex min-w-max items-center gap-3 rounded-full px-3 py-2 text-sm transition lg:mb-3 lg:w-full lg:rounded-none lg:px-0 ${
            activePage === item
              ? 'font-semibold text-[#d95d39] lg:border-r-2 lg:border-[#d95d39]'
              : 'text-[#18312c]/60 hover:text-[#18312c]'
          }`}
          key={item}
          onClick={() => onNavigate(item)}
          type="button"
        >
          <span className="font-mono text-[10px]">
            {String(index + 1).padStart(2, '0')}
          </span>

          {item}
        </button>
      ))}
    </nav>
  )
}