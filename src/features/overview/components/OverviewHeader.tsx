import { CalendarDays, ChevronDown, Leaf, Search } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
}

interface FilterProps {
  label: string
  value: string
  icon: typeof Leaf
  options: readonly FilterOption[]
  onChange: (value: string) => void
}

interface OverviewFilters {
  crop: string
  season: string
  year: string
}

interface OverviewHeaderProps {
  filters: OverviewFilters
  districtSearch: string
  onFilterChange: (filter: keyof OverviewFilters, value: string) => void
  onDistrictSearchChange: (value: string) => void
  onApply: () => void
}

const cropOptions: readonly FilterOption[] = [
  { label: 'Maize', value: 'maize' },
  { label: 'Beans', value: 'beans' },
  { label: 'Rice', value: 'rice' },
  { label: 'Wheat', value: 'wheat' },
]

const seasonOptions: readonly FilterOption[] = [
  { label: 'Season A', value: 'season-a' },
  { label: 'Season B', value: 'season-b' },
  { label: 'Season C', value: 'season-c' },
]

const yearOptions: readonly FilterOption[] = [
  { label: '2024/25', value: '2024-25' },
  { label: '2023/24', value: '2023-24' },
  { label: '2022/23', value: '2022-23' },
]

function Filter({
  label,
  value,
  icon: Icon,
  options,
  onChange,
}: FilterProps) {
  return (
    <label className="relative flex min-h-14 min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-colors hover:border-slate-300 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20">
      <Icon
        aria-hidden="true"
        className="size-5 shrink-0 text-green-700"
        strokeWidth={1.8}
      />

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>

        <select
          aria-label={label}
          className="w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm font-semibold text-slate-900 outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 size-4 text-slate-400"
      />
    </label>
  )
}

export function OverviewHeader({
  filters,
  districtSearch,
  onFilterChange,
  onDistrictSearchChange,
  onApply,
}: OverviewHeaderProps) {
  return (
    <section className="shrink-0">
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

      <div className="mt-6 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <Filter
          icon={Leaf}
          label="Crop"
          options={cropOptions}
          value={filters.crop}
          onChange={(value) => onFilterChange('crop', value)}
        />

        <Filter
          icon={CalendarDays}
          label="Season"
          options={seasonOptions}
          value={filters.season}
          onChange={(value) => onFilterChange('season', value)}
        />

        <Filter
          icon={CalendarDays}
          label="Year"
          options={yearOptions}
          value={filters.year}
          onChange={(value) => onFilterChange('year', value)}
        />

        <button
          className="min-h-14 rounded-xl bg-green-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 lg:px-7"
          onClick={onApply}
          type="button"
        >
          Apply
        </button>
      </div>

      <div className="mt-3 max-w-xl">
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition-colors focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20">
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-slate-400"
            strokeWidth={1.8}
          />

          <input
            aria-label="Search district"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            onChange={(event) => onDistrictSearchChange(event.target.value)}
            placeholder="Search district..."
            type="search"
            value={districtSearch}
          />
        </label>
      </div>
    </section>
  )
}