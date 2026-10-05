import { ArrowRight } from 'lucide-react'

import { getNationalMaizeYieldReference } from '../data/agriculturalData'
import { getDistrictInsight } from '../data/districtInsights'
import type { InterventionSignalLevel } from '../types/interventionSignal.types'

interface AgriculturalInsightPanelProps {
  crop: string
  season: string
  selectedDistrict?: string
  year: string
  onOpenDistrictProfile: () => void
}

function getSignalLabel(level: InterventionSignalLevel): string {
  switch (level) {
    case 'attention':
      return 'Attention'
    case 'moderate':
      return 'Moderate'
    case 'near-reference':
      return 'Near reference'
  }
}

function getSignalClasses(level: InterventionSignalLevel): string {
  switch (level) {
    case 'attention':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200'
    case 'moderate':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
    case 'near-reference':
      return 'bg-green-50 text-green-800 ring-1 ring-green-200'
  }
}

function getSeasonLabel(season: string): string {
  return season === 'season-a' ? 'Season A' : season.replace('-', ' ')
}

export function AgriculturalInsightPanel({
  crop,
  season,
  selectedDistrict,
  year,
  onOpenDistrictProfile,
}: AgriculturalInsightPanelProps) {
  const supportsSelectedPeriod =
    crop === 'maize' && season === 'season-a' && year === '2024-25'
  const candidate =
    supportsSelectedPeriod && selectedDistrict
      ? getDistrictInsight(selectedDistrict)
      : undefined
  const insight = candidate?.source.kind === 'nisr' ? candidate : undefined
  const reference = getNationalMaizeYieldReference()
  const yieldTable = reference.source.references.find((item) =>
    item.table.includes('Table 19'),
  )

  return (
    <aside
      aria-label="District agricultural evidence"
      className="min-w-0"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-green-800">
              {selectedDistrict ? 'District evidence' : 'Data in view'}
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
              {insight
                ? 'Intervention signal'
                : selectedDistrict && supportsSelectedPeriod
                  ? 'District data unavailable'
                  : supportsSelectedPeriod
                    ? 'Select a district'
                    : 'No data for this period'}
            </h2>
          </div>

          {insight && (
            <span
              className={`inline-flex min-h-7 shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getSignalClasses(insight.interventionSignal.level)}`}
            >
              {getSignalLabel(insight.interventionSignal.level)}
            </span>
          )}
        </div>

        {insight ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {insight.district} · {insight.crop} · {insight.season} ·{' '}
              {insight.year}
            </p>

            <div className="mt-5 border-y border-slate-200 py-4">
              <p className="text-xs font-medium text-slate-600">
                Yield gap relative to national reference
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {insight.interventionSignal.yieldGapPct > 0 ? '+' : ''}
                {insight.interventionSignal.yieldGapPct.toFixed(1)}%
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Calculated from district average yield and the NISR national
                maize yield reference.
              </p>
            </div>

            <dl className="grid grid-cols-2 divide-x divide-slate-200 py-4">
              <div className="pr-3">
                <dt className="text-xs text-slate-500">District yield</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                  {insight.averageYield}
                </dd>
              </div>
              <div className="pl-4">
                <dt className="text-xs text-slate-500">National reference</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                  {(insight.interventionSignal.referenceYield / 1000).toFixed(2)}{' '}
                  t/ha
                </dd>
              </div>
            </dl>

            <button
              className="mt-1 inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-300 px-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-green-700 hover:bg-green-50 hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              onClick={onOpenDistrictProfile}
              type="button"
            >
              Open district profile
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm leading-6 text-slate-600">
              {supportsSelectedPeriod
                ? 'Select a district on the map or use district search to review its yield and evidence.'
                : 'Verified district yield observations are currently available for maize, Season A, 2024/25.'}
            </p>
            {selectedDistrict && !supportsSelectedPeriod && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                No NISR observations are connected for {crop},{' '}
                {getSeasonLabel(season)}, {year.replace('-', '/')}.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Source
          </p>
          <a
            className="mt-1 inline-block text-sm font-medium text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950"
            href={reference.source.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            NISR Seasonal Agricultural Survey 2025
          </a>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Season A · Agricultural year 2024/25
            {yieldTable && ` · ${yieldTable.table.split(':')[0]}, p. ${yieldTable.page}`}
          </p>
        </div>
      </section>
    </aside>
  )
}
