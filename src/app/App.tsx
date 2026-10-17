import { lazy, Suspense, useState } from 'react'

import type { AgriculturalSeason } from '../types/data-contract'
import type { AgriculturalSignal } from '../types/agricultural-signal'
import { AppShell } from '../components/layout/AppShell'
import {
  navigationItems,
  type NavigationItem,
} from '../components/navigation/navigation.types'
import { AsyncContentBoundary } from '../components/layout/AsyncContentBoundary'
import { loadAgriculturalDataInventory } from '../features/evidence/data/loadAgriculturalEvidence'
import { OverviewPage } from '../features/overview/pages/OverviewPage'
import type { OverviewFilters } from '../features/overview/types/overview.types'
import type { EvidenceNavigationContext } from '../features/evidence/types/evidence.types'

const DistrictProfilePage = lazy(async () => {
  const module =
    await import('../features/district-profile/pages/DistrictProfilePage')
  return { default: module.DistrictProfilePage }
})

const EvidencePage = lazy(async () => {
  const module = await import('../features/evidence/pages/EvidencePage')
  return { default: module.EvidencePage }
})

const DataMethodologyPage = lazy(async () => {
  await loadAgriculturalDataInventory()
  const module =
    await import('../features/methodology/pages/DataMethodologyPage')
  return { default: module.DataMethodologyPage }
})

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

  const openProfileEvidence = (
    signal?: AgriculturalSignal,
    evidenceIds?: readonly string[],
  ) => {
    if (!selectedDistrict) {
      setEvidenceContext(undefined)
      setActivePage('Evidence')
      return
    }

    setEvidenceContext({
      district: selectedDistrict,
      crop: evidenceIds ? 'all' : (signal?.crop ?? overviewFilters.crop),
      year: signal?.period.year ?? overviewFilters.year.replace('-', '/'),
      season: signal?.period.season ?? getSeasonCode(overviewFilters.season),
      intervention:
        signal?.signalType === 'irrigation_investigation'
          ? signal.intervention
          : undefined,
      signalType: signal?.signalType,
      evidenceIds: signal?.evidenceIds ?? evidenceIds,
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
      <AsyncContentBoundary key={activePage}>
        <Suspense
          fallback={
            <p
              className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600"
              role="status"
            >
              Loading {activePage}…
            </p>
          }
        >
          {activePage === 'Overview' && (
            <OverviewPage
              filters={overviewFilters}
              onFilterChange={(filter, value) =>
                setOverviewFilters((current) => ({
                  ...current,
                  [filter]: value,
                }))
              }
              selectedDistrict={selectedDistrict}
              onDistrictSelect={setSelectedDistrict}
              onOpenDistrictProfile={() => setActivePage('District Profile')}
              onOpenEvidence={() => openProfileEvidence()}
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
              selectedCrop={overviewFilters.crop}
              selectedSeason={overviewFilters.season}
              selectedYear={overviewFilters.year}
            />
          )}

          {activePage === 'Data & Methodology' && <DataMethodologyPage />}
        </Suspense>
      </AsyncContentBoundary>
    </AppShell>
  )
}
