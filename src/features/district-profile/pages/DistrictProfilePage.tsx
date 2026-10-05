import { ArrowLeft, MapPin } from 'lucide-react'

import { getDistrictMetadata } from '../data/districtMetadata'
import { getDistrictInsight } from '../../overview/data/districtInsights'
import type { InterventionSignalLevel } from '../../overview/types/interventionSignal.types'

interface DistrictProfilePageProps {
  selectedDistrict?: string
  onNavigateOverview: () => void
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

export function DistrictProfilePage({
  selectedDistrict,
  onNavigateOverview,
}: DistrictProfilePageProps) {
  const candidate = selectedDistrict
    ? getDistrictInsight(selectedDistrict)
    : undefined
  const insight = candidate?.source.kind === 'nisr' ? candidate : undefined

  if (!insight) {
    return (
      <section className="mx-auto max-w-2xl border-l-2 border-green-700 py-2 pl-5 sm:pl-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-green-800">
          District profile
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Select a district to review its evidence
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Choose a district from the Overview map or district search, then open
          its profile. The profile displays only district observations in the
          connected NISR source.
        </p>
      </section>
    )
  }

  const metadata = getDistrictMetadata(insight.district)
  const source = insight.source
  const signal = insight.interventionSignal

  if (source.kind !== 'nisr') {
    return null
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          onClick={onNavigateOverview}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Overview
        </button>

        <div className="border-b border-slate-200 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-800">
            District profile
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {insight.district}
            </h1>
            {metadata && (
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin aria-hidden="true" className="size-4" />
                {metadata.province}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {insight.crop} · {insight.season} · Agricultural year {insight.year}
          </p>
        </div>
      </header>

      <section
        aria-labelledby="district-signal-heading"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="district-signal-heading"
                className="text-base font-semibold text-slate-900"
              >
                Intervention signal
              </h2>
              <span
                className={`inline-flex min-h-7 items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getSignalClasses(signal.level)}`}
              >
                {getSignalLabel(signal.level)}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              The signal compares district maize yield with the NISR national
              reference. It indicates where further investigation may be useful;
              it does not identify a cause.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <p className="text-xs font-medium text-slate-600">
              Yield gap relative to national reference
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {signal.yieldGapPct > 0 ? '+' : ''}
              {signal.yieldGapPct.toFixed(1)}%
            </p>
          </div>
        </div>

        <dl className="mt-5 grid border-y border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-slate-200">
          <div className="py-3 sm:pr-4">
            <dt className="text-xs text-slate-500">District average yield</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
              {insight.averageYield}
            </dd>
          </div>
          <div className="border-t border-slate-200 py-3 sm:border-t-0 sm:pl-5">
            <dt className="text-xs text-slate-500">National yield reference</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
              {(signal.referenceYield / 1000).toFixed(3)} t/ha
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="productivity-heading">
        <div className="mb-3">
          <h2
            id="productivity-heading"
            className="text-base font-semibold text-slate-900"
          >
            Productivity overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Observed district production and cultivated area for this period.
          </p>
        </div>
        <dl className="grid border-y border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-slate-200">
          <div className="py-3 sm:pr-5">
            <dt className="text-xs text-slate-500">Production</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
              {insight.totalProduction}
            </dd>
          </div>
          <div className="border-t border-slate-200 py-3 sm:border-t-0 sm:pl-5">
            <dt className="text-xs text-slate-500">Cultivated area</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
              {insight.cultivatedArea}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          NISR SAS 2025 Annual Report · Production: Table 24, p. 61 · Area:
          Table 13, p. 50.
        </p>
      </section>

      <section aria-labelledby="yield-trend-heading">
        <div className="mb-3">
          <h2
            id="yield-trend-heading"
            className="text-base font-semibold text-slate-900"
          >
            Yield trend
          </h2>
        </div>
        <p className="border-l-2 border-slate-300 py-1 pl-4 text-sm leading-6 text-slate-600">
          Historical district yield observations are not connected, so a trend
          cannot be shown for this district.
        </p>
      </section>

      <section aria-labelledby="signal-evidence-heading">
        <div className="mb-3">
          <h2
            id="signal-evidence-heading"
            className="text-base font-semibold text-slate-900"
          >
            Evidence behind the signal
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            The yield gap is calculated from the district average maize yield
            and the NISR national maize yield reference for the same period.
          </p>
        </div>
        <div className="border-y border-slate-200 py-3 text-sm leading-6 text-slate-700">
          Yield gap (%) = (district yield − national reference) ÷ national
          reference × 100.
          <p className="mt-2 text-xs text-slate-500">
            Both yield values are reported in SAS 2025 Annual Report Table 19,
            p. 56.
          </p>
        </div>
      </section>

      <section aria-labelledby="intervention-areas-heading">
        <div className="mb-3">
          <h2
            id="intervention-areas-heading"
            className="text-base font-semibold text-slate-900"
          >
            Potential intervention areas
          </h2>
        </div>
        <p className="border-l-2 border-amber-500 py-1 pl-4 text-sm leading-6 text-slate-600">
          Verified input-use, irrigation, and extension indicators are not
          connected for this district and period. The yield gap alone does not
          show which intervention would address it.
        </p>
      </section>

      <section
        aria-labelledby="source-methodology-heading"
        className="border-t border-slate-200 pt-5"
      >
        <h2
          id="source-methodology-heading"
          className="text-base font-semibold text-slate-900"
        >
          Source and methodology
        </h2>
        <a
          className="mt-2 inline-block text-sm font-medium text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950"
          href={source.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          {source.report}
        </a>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
          {source.references.map((reference) => (
            <li key={reference.table}>
              {reference.table} · p. {reference.page}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Yield gap uses the district yield and national yield reference from
          Table 19. Source values and units are displayed as reported.
        </p>
      </section>
    </div>
  )
}
