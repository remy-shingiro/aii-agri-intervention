import {
  CalendarDays,
  ChevronDown,
  Leaf,
  UserCircle,
} from 'lucide-react'

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:min-h-20 sm:gap-6 sm:px-6 lg:px-8">
        {/* Product identity */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 sm:size-10 sm:rounded-xl"
          >
            <Leaf className="size-5 sm:size-6" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base lg:text-lg">
              Agricultural Intervention Intelligence
            </h1>

            <p className="hidden truncate text-xs text-slate-500 sm:block">
              NISR Data • Better Insights • Stronger Agricultural Planning
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Rwanda selector */}
          <button
            aria-label="Select country: Rwanda"
            className="flex size-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:h-10 sm:w-auto sm:gap-1.5"
            type="button"
          >
            <Leaf
              aria-hidden="true"
              className="size-4 shrink-0 text-green-700"
              strokeWidth={2}
            />

            <span className="hidden sm:inline">Rwanda</span>

            <ChevronDown
              aria-hidden="true"
              className="hidden size-4 text-slate-400 sm:block"
            />
          </button>

          {/* Period selector */}
          <button
            aria-label="Select period: 2024/25"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:h-10 sm:gap-2 sm:px-3"
            type="button"
          >
            <CalendarDays
              aria-hidden="true"
              className="size-4 shrink-0 text-slate-500"
            />

            <span>2024/25</span>

            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-slate-400"
            />
          </button>

          {/* Profile */}
          <button
            aria-label="Open profile"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:size-10"
            type="button"
          >
            <UserCircle aria-hidden="true" className="size-5 sm:size-5" />
          </button>
        </div>
      </div>
    </header>
  )
}