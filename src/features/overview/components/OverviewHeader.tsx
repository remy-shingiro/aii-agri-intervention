import {
  CalendarDays,
  ChevronDown,
  Leaf,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { DistrictSearchInput } from './DistrictSearchInput'

interface OverviewFilters {
  crop: string
  season: string
  year: string
}

interface OverviewHeaderProps {
  districtSearch: string
  filters: OverviewFilters
  onApply: () => void
  onDistrictSearchChange: (value: string) => void
  onFilterChange: (
    filter: keyof OverviewFilters,
    value: string,
  ) => void
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

const cropOptions: FilterOption[] = [
  { label: 'Maize', value: 'maize' },
  { label: 'Beans', value: 'beans' },
  { label: 'Rice', value: 'rice' },
  { label: 'Wheat', value: 'wheat' },
]

const seasonOptions: FilterOption[] = [
  { label: 'Season A', value: 'season-a' },
  { label: 'Season B', value: 'season-b' },
  { label: 'Season C', value: 'season-c' },
]

const yearOptions: FilterOption[] = [
  { label: '2024/25', value: '2024-25' },
  { label: '2023/24', value: '2023-24' },
  { label: '2022/23', value: '2022-23' },
]

export function OverviewHeader({
  districtSearch,
  filters,
  onApply,
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

        const geoJson =
          (await response.json()) as DistrictGeoJson

        const districtNames = Array.from(
          new Set(
            (geoJson.features ?? [])
              .map((feature) =>
                feature.properties?.district?.trim(),
              )
              .filter(
                (district): district is string =>
                  Boolean(district),
              ),
          ),
        ).sort((first, second) =>
          first.localeCompare(second),
        )

        if (!cancelled) {
          setDistricts(districtNames)
        }
      } catch (error) {
        console.error(
          'Failed to load Rwanda district names:',
          error,
        )
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Rwanda Agricultural Overview
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Explore agricultural productivity patterns across
            Rwanda&apos;s districts and identify areas requiring
            attention.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(150px,1fr))_auto] lg:items-end">
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              District
            </label>

            <DistrictSearchInput
              districts={districts}
              onChange={onDistrictSearchChange}
              onSelect={onDistrictSearchChange}
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
                onChange={(event) =>
                  onFilterChange('crop', event.target.value)
                }
                value={filters.crop}
              >
                {cropOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
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
                  <option
                    key={option.value}
                    value={option.value}
                  >
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
                onChange={(event) =>
                  onFilterChange('year', event.target.value)
                }
                value={filters.year}
              >
                {yearOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
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

          <button
            className="h-11 rounded-lg bg-green-700 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            onClick={onApply}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>
    </section>
  )
}