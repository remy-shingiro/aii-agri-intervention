import { useState } from 'react'

import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'

interface OverviewFilters {
  crop: string
  season: string
  year: string
}

export function OverviewPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>()
  const [districtSearch, setDistrictSearch] = useState('')
  const [filters, setFilters] = useState<OverviewFilters>({
    crop: 'maize',
    season: 'season-a',
    year: '2024-25',
  })

  const handleFilterChange = (
    filter: keyof OverviewFilters,
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [filter]: value,
    }))
  }

  const handleDistrictSearchChange = (value: string) => {
    setDistrictSearch(value)

    setSelectedDistrict(undefined)
  }

  const handleApply = () => {
    setSelectedDistrict(undefined)
  }

  return (
    <div className="grid min-h-[calc(100vh-5rem)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="flex min-w-0 flex-col gap-8">
        <OverviewHeader
          districtSearch={districtSearch}
          filters={filters}
          onApply={handleApply}
          onDistrictSearchChange={handleDistrictSearchChange}
          onFilterChange={handleFilterChange}
        />

        <div className="min-h-0 flex-1">
          <RwandaMapPanel
            crop={filters.crop}
            districtSearch={districtSearch}
            season={filters.season}
            selectedDistrict={selectedDistrict}
            year={filters.year}
            onDistrictSelect={setSelectedDistrict}
          />
        </div>
      </main>

      <AgriculturalInsightPanel
        selectedDistrict={selectedDistrict}
      />
    </div>
  )
}