import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { AgriculturalSeason } from '../../../types/data-contract'
import { calculateNationalIntelligence } from '../../intelligence/nationalIntelligence'
import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { AsyncContentBoundary } from '../../../components/layout/AsyncContentBoundary'
import type { OverviewFilters } from '../types/overview.types'

const RwandaMapPanel = lazy(async () => {
  const module = await import('../components/RwandaMapPanel')
  return { default: module.RwandaMapPanel }
})

const mapPanelClassName =
  'relative h-[clamp(360px,60vh,660px)] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-[min(68vh,700px)]'

function DeferredDistrictMapPanel(
  props: ComponentProps<typeof RwandaMapPanel>,
) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isNearViewport, setIsNearViewport] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(panel)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={panelRef}>
      {isNearViewport ? (
        <AsyncContentBoundary
          className={mapPanelClassName}
          message="The district map code could not be loaded. Other overview information remains available."
        >
          <Suspense
            fallback={
              <div
                className={`${mapPanelClassName} flex items-center justify-center`}
                role="status"
              >
                <p className="text-sm text-slate-500">
                  Loading Rwanda district map…
                </p>
              </div>
            }
          >
            <RwandaMapPanel {...props} />
          </Suspense>
        </AsyncContentBoundary>
      ) : (
        <div
          className={`${mapPanelClassName} flex items-center justify-center`}
          role="status"
        >
          <p className="px-6 text-center text-sm text-slate-500">
            The interactive map loads as you reach it.
          </p>
        </div>
      )}
    </div>
  )
}

interface OverviewPageProps {
  filters: OverviewFilters
  selectedDistrict?: string
  onFilterChange: (filter: keyof OverviewFilters, value: string) => void
  onDistrictSelect: (district: string | undefined) => void
  onOpenDistrictProfile: () => void
  onOpenInvestigationBrief: () => void
  onOpenEvidence: () => void
}

export function OverviewPage({
  filters,
  selectedDistrict,
  onFilterChange,
  onDistrictSelect,
  onOpenDistrictProfile,
  onOpenInvestigationBrief,
  onOpenEvidence,
}: OverviewPageProps) {
  const [districtSearch, setDistrictSearch] = useState('')
  const nationalIntelligence = useMemo(() => {
    const seasonCode = (
      {
        'season-a': 'A',
        'season-b': 'B',
        'season-c': 'C',
      } as const
    )[filters.season] as AgriculturalSeason | undefined
    return calculateNationalIntelligence(evidenceRecords, {
      crop: filters.crop,
      season: seasonCode,
      year: filters.year,
    })
  }, [filters.crop, filters.season, filters.year])

  const handleDistrictSearchChange = (value: string) => {
    setDistrictSearch(value)
    onDistrictSelect(undefined)
  }

  const handleDistrictSelect = (district: string) => {
    setDistrictSearch(district)
    onDistrictSelect(district)
  }

  const hasObservations = nationalIntelligence.observedYieldDistrictCount > 0

  const cropLabel = filters.crop[0].toUpperCase() + filters.crop.slice(1)
  const seasonLabel =
    filters.season === 'season-a'
      ? 'Season A'
      : filters.season
          .replace('-', ' ')
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
  const yearLabel = filters.year.replace('-', '/')

  const intelligenceMetrics: readonly {
    readonly label: string
    readonly value: number
    readonly detail: string
  }[] = [
    {
      label: 'Districts analyzed',
      value: nationalIntelligence.districtsAnalyzed,
      detail:
        nationalIntelligence.districtsInScope > 0
          ? `of ${nationalIntelligence.districtsInScope} districts with selected-period yield records; ${nationalIntelligence.insufficientEvidenceCount} lack a comparable reference`
          : 'No connected district yield evidence for this selection',
    },
    {
      label: 'Below national reference',
      value: nationalIntelligence.productivityGapCount,
      detail:
        nationalIntelligence.districtsAnalyzed > 0
          ? `of ${nationalIntelligence.districtsAnalyzed} comparable district yields`
          : 'No comparable district yield evidence for this selection',
    },
    {
      label: 'Irrigation investigation',
      value: nationalIntelligence.irrigationInvestigationCount,
      detail: `${nationalIntelligence.irrigationEvaluatedDistrictCount} comparable checks; ${nationalIntelligence.irrigationInsufficientEvidenceCount} lack required evidence`,
    },
  ]

  const directionSummary = [
    `Improving ${nationalIntelligence.improvingDistrictCount}`,
    `Declining ${nationalIntelligence.decliningDistrictCount}`,
    `Relatively stable ${nationalIntelligence.stableDistrictCount}`,
    `Insufficient evidence ${nationalIntelligence.trendInsufficientEvidenceCount}`,
  ].join(' | ')
  const districtSignalGroups: readonly {
    readonly label: string
    readonly districts: readonly string[]
  }[] = [
    {
      label: 'Comparable yield evidence',
      districts: nationalIntelligence.districtsBySignal.comparableYield,
    },
    {
      label: 'Insufficient yield evidence',
      districts: nationalIntelligence.districtsBySignal.insufficientYield,
    },
    {
      label: 'Below national reference',
      districts: nationalIntelligence.districtsBySignal.productivityGap,
    },
    {
      label: 'Improving productivity direction',
      districts: nationalIntelligence.districtsBySignal.improving,
    },
    {
      label: 'Declining productivity direction',
      districts: nationalIntelligence.districtsBySignal.declining,
    },
    {
      label: 'Relatively stable productivity direction',
      districts: nationalIntelligence.districtsBySignal.stable,
    },
    {
      label: 'Irrigation investigation',
      districts: nationalIntelligence.districtsBySignal.irrigationInvestigation,
    },
    {
      label: 'Insufficient irrigation evidence',
      districts: nationalIntelligence.districtsBySignal.irrigationInsufficient,
    },
  ]

  return (
    <div className="space-y-5">
      <OverviewHeader
        districtSearch={districtSearch}
        filters={filters}
        onDistrictSelect={handleDistrictSelect}
        onDistrictSearchChange={handleDistrictSearchChange}
        onFilterChange={onFilterChange}
      />

      <section
        aria-labelledby="overview-map-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
      >
        <header className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2
              id="overview-map-heading"
              className="text-base font-bold tracking-tight text-forest-950 sm:text-lg"
            >
              {hasObservations
                ? `${cropLabel} yield comparison by district`
                : 'District map'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {selectedDistrict
                ? `${selectedDistrict} selected · choose another district on the map or search above`
                : 'Select a district on the map or with the search above to inspect its evidence.'}
            </p>
          </div>
          <p className="rounded-full bg-sage-50 px-3 py-1.5 text-xs font-semibold text-forest-900">
            Rwanda <span aria-hidden="true">·</span> {seasonLabel}{' '}
            <span aria-hidden="true">·</span> {yearLabel}
          </p>
        </header>

        <p id="district-map-help" className="sr-only">
          Use the district search field above to select a district with a
          keyboard. The map can also be explored with pointer controls.
        </p>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
          <DeferredDistrictMapPanel
            crop={filters.crop}
            districtSearch={districtSearch}
            season={filters.season}
            selectedDistrict={selectedDistrict}
            year={filters.year}
            onDistrictSelect={handleDistrictSelect}
          />

          <AgriculturalInsightPanel
            crop={filters.crop}
            season={filters.season}
            selectedDistrict={selectedDistrict}
            year={filters.year}
            onOpenDistrictProfile={onOpenDistrictProfile}
            onOpenInvestigationBrief={onOpenInvestigationBrief}
            onOpenEvidence={onOpenEvidence}
          />
        </div>
      </section>

      <section
        aria-labelledby="national-intelligence-heading"
        className="space-y-3"
      >
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              className="text-base font-bold tracking-tight text-forest-950"
              id="national-intelligence-heading"
            >
              National Agricultural Intelligence
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {cropLabel} · {seasonLabel} · {yearLabel}
            </p>
          </div>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600">
            Signals summarize connected NISR evidence for the selected crop and
            period. They identify areas for further investigation and do not
            establish causality.
          </p>
        </div>

        <section
          aria-label="National agricultural intelligence metrics"
          className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {intelligenceMetrics.map((metric, index) => (
            <article
              className={`min-w-0 rounded-xl border bg-white p-4 shadow-sm ${
                index === 1 ? 'border-amber-200' : 'border-slate-200'
              }`}
              key={metric.label}
            >
              <h3 className="text-xs font-bold text-slate-600">
                {metric.label}
              </h3>
              <p className="mt-1 text-2xl font-bold tabular-nums text-forest-950">
                {metric.value.toLocaleString('en-RW')}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {metric.detail}
              </p>
            </article>
          ))}
        </section>

        <details className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-forest-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2">
            View district groupings, productivity direction and NISR sources
          </summary>
          <p className="border-t border-slate-200 py-3 text-sm leading-6 text-slate-700">
            Productivity direction (same crop and season): {directionSummary}.
            This compares earliest and latest connected periods; it is not a
            significance test.
          </p>
          <dl className="grid gap-x-5 gap-y-3 border-t border-slate-200 pt-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {districtSignalGroups.map(({ label, districts }) => (
              <div className="min-w-0" key={label}>
                <dt className="font-medium text-slate-600">{label}</dt>
                <dd className="mt-1 break-words text-slate-800">
                  {districts.length > 0
                    ? districts.join(', ')
                    : 'None in connected evidence for this selection'}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 border-t border-slate-200 pt-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Connected source references
            </h3>
            {nationalIntelligence.sourceReferences.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5">
                {nationalIntelligence.sourceReferences.map((reference) => (
                  <li
                    key={`${reference.dataset}:${reference.table}:${reference.page ?? ''}`}
                  >
                    <a
                      className="text-agri-700 underline decoration-green-700/40 underline-offset-2 hover:text-forest-950"
                      href={reference.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {reference.dataset}: {reference.table}
                      {reference.page ? `, p. ${reference.page}` : ''}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                No connected source references for this selection.
              </p>
            )}
          </div>
        </details>
      </section>
    </div>
  )
}
