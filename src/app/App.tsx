import { useState } from 'react'

import { AppShell } from '../components/layout/AppShell'
import {
  navigationItems,
  type NavigationItem,
} from '../components/navigation/navigation.types'
import { DistrictProfilePage } from '../features/district-profile/pages/DistrictProfilePage'
import { OverviewPage } from '../features/overview/pages/OverviewPage'

export function App() {
  const [activePage, setActivePage] =
    useState<NavigationItem>('Overview')

  const [selectedDistrict, setSelectedDistrict] =
    useState<string>()

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
        />
      )}

      {activePage === 'District Profile' && (
        <DistrictProfilePage
          selectedDistrict={selectedDistrict}
          onDistrictSelect={setSelectedDistrict}
        />
      )}
    </AppShell>
  )
}
