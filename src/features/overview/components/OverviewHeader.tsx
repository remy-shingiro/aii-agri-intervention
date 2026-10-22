import { CalendarDays, ChevronDown, Leaf } from 'lucide-react'

import { DistrictSearchInput } from './DistrictSearchInput'
import { normalizedEvidenceRecords } from '../../evidence/data/agriculturalEvidence'
import { districtMetadata } from '../../district-profile/data/districtMetadata'

interface OverviewFilters {
  crop: string
  season: string
  year: string
}

interface OverviewHeaderProps {
  districtSearch: string
  filters: OverviewFilters
  onDistrictSelect: (district: string) => void
  onDistrictSearchChange: (value: string) => void
  onFilterChange: (filter: keyof OverviewFilters, value: string) => void
}

interface FilterOption {
  label: string
  value: string
}

const districts = districtMetadata
  .map(({ district }) => district)
  .sort((first, second) => first.localeCompare(second))

const yieldObservations = normalizedEvidenceRecords.filter(
  (record) =>
    record.indicator === 'average_yield' &&
    record.status === 'observed' &&
    record.geography.level === 'district' &&
    record.crop,
)

const cropOptions: FilterOption[] = [
  ...new Set(
    yieldObservations.flatMap((record) => (record.crop ? [record.crop] : [])),
  ),
]
  .sort((first, second) => first.localeCompare(second))
  .map((crop) => ({
    label: crop.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value: crop.toLowerCase(),
  }))

const seasonOptions: FilterOption[] = [
  ...new Set(
    yieldObservations.flatMap((record) =>
      record.period.season ? [record.period.season] : [],
    ),
  ),
]
  .sort()
  .map((season) => ({
    label: `Season ${season}`,
    value: `season-${season.toLowerCase()}`,
  }))

const yearOptions: FilterOption[] = [
  ...new Set(yieldObservations.map((record) => record.period.year)),
]
  .sort()
  .reverse()
  .map((year) => ({
    label: year,
    value: year.replace('/', '-'),
  }))

export function OverviewHeader({
  districtSearch,
  filters,
  onDistrictSelect,
  onDistrictSearchChange,
  onFilterChange,
}: OverviewHeaderProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-agri-700">
          Agricultural intelligence
        </p>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-forest-950 sm:text-4xl">
            Rwanda Agricultural Overview
          </h1>

          <p className="mt-2 text-base font-semibold tracking-tight text-forest-900 sm:text-lg">
            Find the gaps. Understand the evidence.
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Explore Rwanda’s agricultural productivity through published NISR
            statistics, with every finding linked to its source.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div
          role="group"
          aria-label="Agricultural observation filters"
          className="grid grid-cols-2 gap-3 xl:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(130px,1fr))] xl:items-end"
        >
          <div className="col-span-2 min-w-0 xl:col-span-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              District
            </p>

            <DistrictSearchInput
              districts={districts}
              onChange={onDistrictSearchChange}
              onSelect={onDistrictSelect}
              placeholder="Search district"
              value={districtSearch}
            />
          </div>

          <div className="min-w-0">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              htmlFor="crop-filter"
            >
              Crop
            </label>

            <div className="relative">
              <Leaf
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-green-600"
              />

              <select
                className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/10"
                id="crop-filter"
                name="crop"
                onChange={(event) => onFilterChange('crop', event.target.value)}
                value={filters.crop}
              >
                {cropOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              htmlFor="season-filter"
            >
              Season
            </label>

            <div className="relative">
              <select
                className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/10"
                id="season-filter"
                name="season"
                onChange={(event) =>
                  onFilterChange('season', event.target.value)
                }
                value={filters.season}
              >
                {seasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              htmlFor="year-filter"
            >
              Year
            </label>

            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              />

              <select
                className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/10"
                id="year-filter"
                name="year"
                onChange={(event) => onFilterChange('year', event.target.value)}
                value={filters.year}
              >
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Crop, season, and year options come from observed district yield rows
          in the connected NISR evidence.
        </p>
      </div>
    </section>
  )
}
