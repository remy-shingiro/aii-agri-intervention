import { CalendarDays, ChevronDown, Leaf } from 'lucide-react'

interface FilterProps {
  label: string
  value: string
  icon: typeof Leaf
}

function Filter({ label, value, icon: Icon }: FilterProps) {
  return (
    <button
      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
      type="button"
    >
      <Icon
        aria-hidden="true"
        className="size-5 shrink-0 text-green-700"
        strokeWidth={1.8}
      />

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>

        <span className="block truncate text-sm font-semibold text-slate-900">
          {value}
        </span>
      </span>

      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-slate-400"
      />
    </button>
  )
}

export function OverviewHeader() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
        Rwanda Agricultural Overview
      </p>

      <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
        Where should agricultural planners look first?
      </h2>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
        The map highlights districts that require attention based on NISR
        agricultural statistics, helping planners identify where support and
        resources may be needed most.
      </p>

      <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <Filter
          icon={Leaf}
          label="Crop"
          value="Maize"
        />

        <Filter
          icon={CalendarDays}
          label="Season"
          value="Season A"
        />

        <Filter
          icon={CalendarDays}
          label="Year"
          value="2024/25"
        />

        <button
          className="min-h-14 rounded-xl bg-green-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 lg:px-7"
          type="button"
        >
          Apply
        </button>
      </div>
    </section>
  )
}