import { useMemo, useState } from 'react'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { AgriculturalSeason } from '../../../types/data-contract'
import {
  calculateIrrigationInvestigation,
  calculateProductivityTrend,
} from '../../intelligence/agriculturalSignalEngine'
import { AgriculturalInsightPanel } from '../components/AgriculturalInsightPanel'
import { OverviewHeader } from '../components/OverviewHeader'
import { RwandaMapPanel } from '../components/RwandaMapPanel'
import { getDistrictInsights } from '../data/districtInsights'
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
  const districtSignals = useMemo(() => {
    const seasonCode = ({
      'season-a': 'A',
      'season-b': 'B',
      'season-c': 'C',
    } as const)[filters.season] as AgriculturalSeason | undefined
    if (!seasonCode) return []

    return getDistrictInsights(filters.crop, filters.season, filters.year).map(
      (insight) => {
        const context = {
          district: insight.district,
          crop: insight.crop,
          year: filters.year.replace('-', '/'),
          season: seasonCode,
        }
        return [
          insight.productivityGap,
          calculateProductivityTrend(evidenceRecords, context),
          calculateIrrigationInvestigation(evidenceRecords, context),
        ] as const
      },
    )
  }, [filters.crop, filters.season, filters.year])

  const productivityGaps = districtSignals.map(([gap]) => gap)
  const productivityTrends = districtSignals.map(([, trend]) => trend)
  const irrigationSignals = districtSignals.map(([, , irrigation]) => irrigation)
  const belowReferenceCount = productivityGaps.filter(
    (signal) => signal.status === 'below_reference',
  ).length
  const improvingCount = productivityTrends.filter(
    (signal) => signal.status === 'improving',
  ).length
  const decliningCount = productivityTrends.filter(
    (signal) => signal.status === 'declining',
  ).length
  const stableCount = productivityTrends.filter(
    (signal) => signal.status === 'relatively_stable',
  ).length
  const irrigationCount = irrigationSignals.filter(
    (signal) => signal.status === 'supported',
  ).length
  const districtNamesByStatus = {
    belowReference: productivityGaps
      .filter((signal) => signal.status === 'below_reference')
      .map((signal) => signal.district),
    improving: productivityTrends
      .filter((signal) => signal.status === 'improving')
      .map((signal) => signal.district),
    declining: productivityTrends
      .filter((signal) => signal.status === 'declining')
      .map((signal) => signal.district),
    stable: productivityTrends
      .filter((signal) => signal.status === 'relatively_stable')
      .map((signal) => signal.district),
    irrigation: irrigationSignals
      .filter((signal) => signal.status === 'supported')
      .map((signal) => signal.district),
  }

  const handleDistrictSearchChange = (value: string) => {
    setDistrictSearch(value)
    onDistrictSelect(undefined)
  }

  const handleDistrictSelect = (district: string) => {
    setDistrictSearch(district)
    onDistrictSelect(district)
  }

  const hasObservations = productivityGaps.length > 0

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
      label: 'District yield observations',
      value: productivityGaps.length,
      detail: 'districts with observed yield evidence for this period',
    },
    {
      label: 'Below national reference',
      value: belowReferenceCount,
      detail: `of ${productivityGaps.filter((signal) => signal.status !== 'insufficient_evidence').length} comparable district observations`,
    },
    {
      label: 'Irrigation investigation',
      value: irrigationCount,
      detail: 'districts meeting both defined evidence conditions',
    },
  ]

  const directionSummary = `Improving ${improvingCount} · Declining ${decliningCount} · Relatively stable ${stableCount} · Insufficient evidence ${productivityTrends.length - improvingCount - decliningCount - stableCount}`
  const districtSignalGroups: readonly {
    readonly label: string
    readonly districts: readonly string[]
  }[] = [
    { label: 'Below national reference', districts: districtNamesByStatus.belowReference },
    { label: 'Improving productivity direction', districts: districtNamesByStatus.improving },
    { label: 'Declining productivity direction', districts: districtNamesByStatus.declining },
    { label: 'Relatively stable productivity direction', districts: districtNamesByStatus.stable },
    { label: 'Irrigation investigation', districts: districtNamesByStatus.irrigation },
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

      <section
        aria-label="Agricultural intelligence summary"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {intelligenceMetrics.map((metric) => (
          <article
            className="min-w-0 border-l-2 border-slate-300 bg-white px-4 py-3"
            key={metric.label}
          >
            <h2 className="text-xs font-semibold text-slate-600">
              {metric.label}
            </h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {metric.value.toLocaleString('en-RW')}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {metric.detail}
            </p>
          </article>
        ))}
        <article className="min-w-0 border-l-2 border-slate-300 bg-white px-4 py-3">
          <h2 className="text-xs font-semibold text-slate-600">
            Productivity direction · same crop and season
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-700">
            {directionSummary}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Uses earliest and latest comparable connected periods; this is not
            a significance test.
          </p>
        </article>
      </section>

      <details className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
          View districts by evidence signal
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
      </details>

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
