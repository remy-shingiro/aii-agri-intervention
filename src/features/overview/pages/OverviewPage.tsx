import { useState } from 'react'

import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'

export function OverviewPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>()

  return (
    <div className="space-y-8">
      <OverviewHeader />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RwandaMapPanel
          selectedDistrict={selectedDistrict}
          onDistrictSelect={setSelectedDistrict}
        />

        <AgriculturalInsightPanel
          selectedDistrict={selectedDistrict}
        />
      </div>
    </div>
  )
}