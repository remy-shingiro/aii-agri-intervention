import { useState } from 'react'

import { AppShell } from '../components/layout/AppShell'
import {
  navigationItems,
  type NavigationItem,
} from '../components/navigation/navigation.types'
import { DistrictProfilePage } from '../features/district-profile/pages/DistrictProfilePage'
import { EvidencePage } from '../features/evidence/pages/EvidencePage'
import { DataMethodologyPage } from '../features/methodology/pages/DataMethodologyPage'
import { OverviewPage } from '../features/overview/pages/OverviewPage'

export function App() {
  const [activePage, setActivePage] = useState<NavigationItem>('Overview')

  const [selectedDistrict, setSelectedDistrict] = useState<string>()

  return (
    <AppShell
      activePage={activePage}
      navigation={navigationItems}
      onNavigate={setActivePage}
    >
      {activePage === 'Overview' && (
        <OverviewPage
          selectedDistrict={selectedDistrict}
          onDistrictSelect={setSelectedDistrict}
          onOpenDistrictProfile={() => setActivePage('District Profile')}
        />
      )}

      {activePage === 'District Profile' && (
        <DistrictProfilePage
          selectedDistrict={selectedDistrict}
          onOpenEvidence={() => setActivePage('Evidence')}
          onNavigateOverview={() => setActivePage('Overview')}
        />
      )}

      {activePage === 'Evidence' && (
        <EvidencePage
          onOpenDistrictProfile={(district) => {
            setSelectedDistrict(district)
            setActivePage('District Profile')
          }}
          selectedDistrict={selectedDistrict}
        />
      )}

      {activePage === 'Data & Methodology' && <DataMethodologyPage />}
    </AppShell>
  )
}
