import { useMemo, useState } from 'react'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { AgriculturalSeason } from '../../../types/data-contract'
import { calculateNationalIntelligence } from '../../intelligence/nationalIntelligence'
import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'
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
  const nationalIntelligence = useMemo(() => {
    const seasonCode = ({
      'season-a': 'A',
      'season-b': 'B',
      'season-c': 'C',
    } as const)[filters.season] as AgriculturalSeason | undefined
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
      : filters.season.replace('-', ' ').replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        )
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
    <div className="space-y-6">
      <OverviewHeader
        districtSearch={districtSearch}
        filters={filters}
        onDistrictSelect={handleDistrictSelect}
        onDistrictSearchChange={handleDistrictSearchChange}
        onFilterChange={onFilterChange}
      />

      <section aria-labelledby="national-intelligence-heading" className="space-y-3">
        <div>
          <h2
            className="text-base font-semibold tracking-tight text-slate-900"
            id="national-intelligence-heading"
          >
            National Agricultural Intelligence
          </h2>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">
            Signals summarize connected NISR evidence for the selected crop and
            period. They identify areas for further investigation and do not
            establish causality.
          </p>
        </div>

        <section
          aria-label="National agricultural intelligence metrics"
          className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {intelligenceMetrics.map((metric) => (
            <article
              className="min-w-0 border-l-2 border-slate-300 bg-white px-4 py-3"
              key={metric.label}
            >
              <h3 className="text-xs font-semibold text-slate-600">
                {metric.label}
              </h3>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {metric.value.toLocaleString('en-RW')}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {metric.detail}
              </p>
            </article>
          ))}
          <article className="min-w-0 border-l-2 border-slate-300 bg-white px-4 py-3">
            <h3 className="text-xs font-semibold text-slate-600">
              Productivity direction (same crop and season)
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              {directionSummary}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Compares earliest and latest connected periods; this is not a
              significance test.
            </p>
          </article>
        </section>

        <details className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
            View districts and NISR sources
          </summary>
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
            <h3 className="text-sm font-medium text-slate-600">
              Connected source references
            </h3>
            {nationalIntelligence.sourceReferences.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5">
                {nationalIntelligence.sourceReferences.map((reference) => (
                  <li
                    key={`${reference.dataset}:${reference.table}:${reference.page ?? ''}`}
                  >
                    <a
                      className="text-green-800 underline decoration-green-700/40 underline-offset-2 hover:text-green-950"
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
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section aria-labelledby="overview-map-heading" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id="overview-map-heading"
              className="text-base font-semibold tracking-tight text-slate-900"
            >
              {hasObservations
                ? `${cropLabel} yield comparison by district`
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
