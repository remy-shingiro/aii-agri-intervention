import { useState } from 'react'

import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'
import { districtInsights } from '../data/districtInsights'
import type { OverviewFilters } from '../types/overview.types'

interface OverviewPageProps {
  filters: OverviewFilters
  selectedDistrict?: string
  onFilterChange: (filter: keyof OverviewFilters, value: string) => void
  onDistrictSelect: (district: string | undefined) => void
  onOpenDistrictProfile: () => void
}

export function OverviewPage({
  filters,
  selectedDistrict,
  onFilterChange,
  onDistrictSelect,
  onOpenDistrictProfile,
}: OverviewPageProps) {
  const [districtSearch, setDistrictSearch] = useState('')

  const handleDistrictSearchChange = (value: string) => {
    setDistrictSearch(value)
    onDistrictSelect(undefined)
  }

  const handleDistrictSelect = (district: string) => {
    setDistrictSearch(district)
    onDistrictSelect(district)
  }

  const hasObservations = districtInsights.some(
    (district) =>
      district.crop.toLowerCase() === filters.crop &&
      district.season.toLowerCase() ===
        (filters.season === 'season-a'
          ? 'season a'
          : filters.season.replace('-', ' ')) &&
      district.year === filters.year.replace('-', '/'),
  )

  const cropLabel = filters.crop[0].toUpperCase() + filters.crop.slice(1)
  const seasonLabel =
    filters.season === 'season-a'
      ? 'Season A'
      : filters.season.replace('-', ' ').replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        )
  const yearLabel = filters.year.replace('-', '/')

  return (
    <div className="space-y-6">
      <OverviewHeader
        districtSearch={districtSearch}
        filters={filters}
        onDistrictSelect={handleDistrictSelect}
        onDistrictSearchChange={handleDistrictSearchChange}
        onFilterChange={onFilterChange}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section aria-labelledby="overview-map-heading" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id="overview-map-heading"
              className="text-base font-semibold tracking-tight text-slate-900"
            >
              {hasObservations
                ? `${cropLabel} yield gap by district`
                : 'District map'}
            </h2>

            <p className="text-xs text-slate-500">
              Rwanda | {seasonLabel} | {yearLabel}
            </p>
          </div>

          <p id="district-map-help" className="sr-only">
            Use the district search field above to select a district with a
            keyboard. The map can also be explored with pointer controls.
          </p>

          <RwandaMapPanel
            crop={filters.crop}
            districtSearch={districtSearch}
            season={filters.season}
            selectedDistrict={selectedDistrict}
            year={filters.year}
            onDistrictSelect={handleDistrictSelect}
          />
        </section>

        <AgriculturalInsightPanel
          crop={filters.crop}
          season={filters.season}
          selectedDistrict={selectedDistrict}
          year={filters.year}
          onOpenDistrictProfile={onOpenDistrictProfile}
        />
      </div>
    </div>
  )
}
