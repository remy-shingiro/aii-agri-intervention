import { useState } from 'react'

import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'

export function OverviewPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>()

  return (
    <div className="grid min-h-[calc(100vh-5rem)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="flex min-w-0 flex-col gap-8">
        <OverviewHeader />

        <div className="min-h-0 flex-1">
          <RwandaMapPanel
            selectedDistrict={selectedDistrict}
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