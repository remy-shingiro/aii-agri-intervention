import { CalendarDays, ChevronDown, Leaf } from 'lucide-react'
import { useEffect, useState } from 'react'

import { DistrictSearchInput } from './DistrictSearchInput'
import { normalizedEvidenceRecords } from '../../evidence/data/agriculturalEvidence'

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

interface DistrictGeoJson {
  features?: Array<{
    properties?: {
      district?: string
    }
  }>
}

const DISTRICT_SOURCE_URL = '/data/rwanda-districts.geojson'

const yieldObservations = normalizedEvidenceRecords.filter(
  (record) =>
    record.indicator === 'average_yield' &&
    record.status === 'observed' &&
    record.geography.level === 'district' &&
    record.crop,
)

const cropOptions: FilterOption[] = [...new Set(
  yieldObservations.flatMap((record) => record.crop ? [record.crop] : []),
)].sort((first, second) => first.localeCompare(second)).map((crop) => ({
  label: crop,
  value: crop.toLowerCase(),
}))

const seasonOptions: FilterOption[] = [...new Set(
  yieldObservations.flatMap((record) => record.period.season ? [record.period.season] : []),
)].sort().map((season) => ({
  label: `Season ${season}`,
  value: `season-${season.toLowerCase()}`,
}))

const yearOptions: FilterOption[] = [...new Set(
  yieldObservations.map((record) => record.period.year),
)].sort().reverse().map((year) => ({
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
  const [districts, setDistricts] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    const loadDistricts = async () => {
      try {
        const response = await fetch(DISTRICT_SOURCE_URL)

        if (!response.ok) {
          throw new Error(
            `Failed to load district boundaries: ${response.status}`,
          )
        }

        const geoJson = (await response.json()) as DistrictGeoJson

        const districtNames = Array.from(
          new Set(
            (geoJson.features ?? [])
              .map((feature) => feature.properties?.district?.trim())
              .filter((district): district is string => Boolean(district)),
          ),
        ).sort((first, second) => first.localeCompare(second))

        if (!cancelled) {
          setDistricts(districtNames)
        }
      } catch (error) {
        console.error('Failed to load Rwanda district names:', error)
      }
    }

    void loadDistricts()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
          Agricultural intelligence
        </p>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Rwanda Agricultural Overview
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Review available district observations and identify where further
            investigation may be warranted.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div
          role="group"
          aria-label="Agricultural observation filters"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1.4fr)_repeat(3,minmax(120px,1fr))] xl:items-end"
        >
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              District
            </label>

            <DistrictSearchInput
              districts={districts}
              onChange={onDistrictSearchChange}
              onSelect={onDistrictSelect}
              placeholder="Search district"
              value={districtSearch}
            />
          </div>

          <div>
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

          <div>
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

          <div>
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
