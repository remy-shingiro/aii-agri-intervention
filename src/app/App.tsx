import { useState } from 'react'

import type { AgriculturalSeason } from '../types/data-contract'
import type { InterventionSignal } from '../types/intervention'
import { AppShell } from '../components/layout/AppShell'
import {
  navigationItems,
  type NavigationItem,
} from '../components/navigation/navigation.types'
import { DistrictProfilePage } from '../features/district-profile/pages/DistrictProfilePage'
import { EvidencePage } from '../features/evidence/pages/EvidencePage'
import { DataMethodologyPage } from '../features/methodology/pages/DataMethodologyPage'
import { OverviewPage } from '../features/overview/pages/OverviewPage'
import type { OverviewFilters } from '../features/overview/types/overview.types'
import type { EvidenceNavigationContext } from '../features/evidence/types/evidence.types'

function getSeasonCode(value: string): AgriculturalSeason {
  if (value === 'season-b') return 'B'
  if (value === 'season-c') return 'C'
  return 'A'
}

export function App() {
  const [activePage, setActivePage] = useState<NavigationItem>('Overview')

  const [selectedDistrict, setSelectedDistrict] = useState<string>()
  const [overviewFilters, setOverviewFilters] = useState<OverviewFilters>({
    crop: 'maize',
    season: 'season-a',
    year: '2024-25',
  })
  const [evidenceContext, setEvidenceContext] =
    useState<EvidenceNavigationContext>()

  const openProfileEvidence = (signal?: InterventionSignal) => {
    if (!selectedDistrict) {
      setEvidenceContext(undefined)
      setActivePage('Evidence')
      return
    }

    setEvidenceContext({
      district: selectedDistrict,
      crop: signal?.period.crop ?? overviewFilters.crop,
      year: signal?.period.year ?? overviewFilters.year.replace('-', '/'),
      season: signal?.period.season ?? getSeasonCode(overviewFilters.season),
      intervention: signal?.intervention,
      evidenceIds: signal?.evidenceIds,
    })
    setActivePage('Evidence')
  }

  return (
    <AppShell
      activePage={activePage}
      navigation={navigationItems}
      onNavigate={(page) => {
        setEvidenceContext(undefined)
        setActivePage(page)
      }}
    >
      {activePage === 'Overview' && (
        <OverviewPage
          filters={overviewFilters}
          onFilterChange={(filter, value) =>
            setOverviewFilters((current) => ({ ...current, [filter]: value }))
          }
          selectedDistrict={selectedDistrict}
          onDistrictSelect={setSelectedDistrict}
          onOpenDistrictProfile={() => setActivePage('District Profile')}
        />
      )}

      {activePage === 'District Profile' && (
        <DistrictProfilePage
          crop={overviewFilters.crop}
          season={overviewFilters.season}
          selectedDistrict={selectedDistrict}
          year={overviewFilters.year}
          onOpenEvidence={openProfileEvidence}
          onNavigateOverview={() => setActivePage('Overview')}
          onNavigateMethodology={() => {
            setEvidenceContext(undefined)
            setActivePage('Data & Methodology')
          }}
        />
      )}

      {activePage === 'Evidence' && (
        <EvidencePage
          context={evidenceContext}
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
