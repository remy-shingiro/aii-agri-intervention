import { useId, useState } from 'react'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react'

import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { AgriculturalSeason } from '../../../types/data-contract'
import type {
  InterventionSignal,
  InterventionType,
} from '../../../types/intervention'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { getDistrictInsight } from '../../overview/data/districtInsights'
import type { InterventionSignalLevel } from '../../overview/types/interventionSignal.types'
import { calculateInterventionSignals } from '../../overview/utils/calculateCandidateIntervention'
import { getDistrictMetadata } from '../data/districtMetadata'
import {
  getIrrigationEvidenceTrail,
  type IrrigationEvidenceTrailRecords,
} from '../utils/irrigationEvidenceTrail'

interface DistrictProfilePageProps {
  crop: string
  season: string
  selectedDistrict?: string
  year: string
  onOpenEvidence: (signal?: InterventionSignal) => void
  onNavigateOverview: () => void
  onNavigateMethodology: () => void
}

const interventionLabels: Record<InterventionType, string> = {
  irrigation: 'Irrigation',
  soil_fertility: 'Soil fertility',
  post_harvest: 'Post-harvest collection and storage',
  processing: 'Processing and value addition',
  export: 'Export opportunities',
}

function getCropLabel(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getSeasonCode(value: string): AgriculturalSeason {
  if (value === 'season-b') return 'B'
  if (value === 'season-c') return 'C'
  return 'A'
}

function formatValue(record: EvidenceRecord): string {
  if (record.value === null) return 'Unavailable'

  return `${new Intl.NumberFormat('en-RW', {
    maximumFractionDigits: 2,
  }).format(record.value)} ${record.unit}`
}

function EvidenceSourceMetadata({ record }: { record: EvidenceRecord }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <dl className="grid min-w-0 gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="font-medium text-slate-500">Dataset</dt>
        <dd className="min-w-0 break-words text-slate-700">
          NISR · {record.dataset}
        </dd>
        <dt className="font-medium text-slate-500">Table / indicator</dt>
        <dd className="min-w-0 break-words text-slate-700">
          {record.sourceReference.table}
          {record.sourceReference.page !== undefined &&
            ` · p. ${record.sourceReference.page}`}
        </dd>
        <dt className="font-medium text-slate-500">Period</dt>
        <dd className="text-slate-700">
          {record.period.year} · Season {record.period.season}
        </dd>
        <dt className="font-medium text-slate-500">Geography</dt>
        <dd className="break-words text-slate-700">
          {record.geography.name} ({record.geography.level})
        </dd>
        <dt className="font-medium text-slate-500">Evidence ID</dt>
        <dd className="break-all font-mono text-[11px] text-slate-700">
          {record.id}
        </dd>
        <dt className="font-medium text-slate-500">Status</dt>
        <dd>
          <EvidenceStatusBadge status={record.status} />
        </dd>
      </dl>
      <a
        className="mt-2 inline-flex min-h-9 max-w-full items-center gap-1 break-all text-xs font-semibold text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        href={record.source.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        Open NISR source
        <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
      </a>
    </div>
  )
}

function ComparisonEvidence({
  heading,
  district,
  national,
  difference,
  differenceUnit,
}: {
  heading: string
  district: EvidenceRecord
  national: EvidenceRecord
  difference: number
  differenceUnit: string
}) {
  const formattedDifference = new Intl.NumberFormat('en-RW', {
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(difference)

  return (
    <section
      aria-label={heading}
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
    >
      <h4 className="text-sm font-semibold text-slate-900">{heading}</h4>
      <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">
            District · Observed · {district.geography.name}
          </dt>
          <dd className="mt-1 break-words text-lg font-semibold tabular-nums text-slate-900">
            {formatValue(district)}
          </dd>
        </div>
        <div className="min-w-0 border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <dt className="text-xs text-slate-500">
            National reference · Observed
          </dt>
          <dd className="mt-1 break-words text-lg font-semibold tabular-nums text-slate-900">
            {formatValue(national)}
          </dd>
        </div>
        <div className="min-w-0 border-t border-slate-100 pt-3 sm:col-span-2">
          <dt className="text-xs text-slate-500">
            Difference · Derived (district − national)
          </dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 break-words text-base font-semibold tabular-nums text-slate-900">
            {formattedDifference} {differenceUnit}
            <EvidenceStatusBadge status="derived" />
          </dd>
        </div>
      </dl>
      <div className="mt-4 grid min-w-0 gap-2 border-t border-slate-100 pt-3">
        <EvidenceSourceMetadata record={district} />
        <EvidenceSourceMetadata record={national} />
      </div>
    </section>
  )
}

function IrrigationEvidenceTrailContent({
  signal,
  trailRecords,
  yieldDifference,
  irrigationDifference,
  onOpenEvidence,
  onNavigateMethodology,
}: {
  signal: InterventionSignal
  trailRecords: IrrigationEvidenceTrailRecords
  yieldDifference: number
  irrigationDifference: number
  onOpenEvidence: (signal?: InterventionSignal) => void
  onNavigateMethodology: () => void
}) {
  const detailsId = useId()
  const [expanded, setExpanded] = useState(false)
  const { districtYield, nationalYield, districtIrrigation, nationalIrrigation } =
    trailRecords

  return (
    <div className="mt-4 border-t border-green-200 pt-3">
      <button
        aria-controls={detailsId}
        aria-expanded={expanded}
        className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-semibold text-green-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {expanded ? 'Hide signal evidence' : 'Why this signal?'}
        <ArrowRight
          aria-hidden="true"
          className={`size-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      <div
        className="mt-3 space-y-4 rounded-xl border border-green-200 bg-white p-4 sm:p-5"
        hidden={!expanded}
        id={detailsId}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
            Why this signal?
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">
            Irrigation investigation signal
          </h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            The signal is shown because both same-period comparisons are below
            their national references:
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-6 text-slate-700">
            <li>District maize yield is below the national reference.</li>
            <li>
              District-wide irrigation practice is below the national
              reference.
            </li>
          </ol>
        </div>

        <ComparisonEvidence
          difference={yieldDifference}
          differenceUnit={districtYield.differenceUnit ?? districtYield.unit}
          district={districtYield}
          heading="Maize yield comparison"
          national={nationalYield}
        />

        <ComparisonEvidence
          difference={irrigationDifference}
          differenceUnit={
            districtIrrigation.differenceUnit ?? 'percentage points'
          }
          district={districtIrrigation}
          heading="District-wide irrigation comparison"
          national={nationalIrrigation}
        />

        <p className="border-l-2 border-amber-500 py-1 pl-3 text-sm leading-6 text-slate-700">
          <span className="font-semibold">Interpretation:</span> This is an
          evidence-screening signal. It identifies a district where maize yield
          and irrigation practice are both below their same-period national
          references. The comparison does not establish that lower irrigation
          caused lower yield or that irrigation investment will necessarily
          increase productivity.
        </p>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-md bg-green-800 px-3 text-xs font-semibold text-white hover:bg-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={() => onOpenEvidence(signal)}
            type="button"
          >
            Open Evidence Explorer
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-md px-3 text-xs font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={onNavigateMethodology}
            type="button"
          >
            View Methodology
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function InterventionAreas({
  signals,
  onOpenEvidence,
  onNavigateMethodology,
}: {
  signals: readonly InterventionSignal[]
  onOpenEvidence: (signal?: InterventionSignal) => void
  onNavigateMethodology: () => void
}) {
  return (
    <section aria-labelledby="intervention-areas-heading">
      <div className="mb-3">
        <h2
          className="text-base font-semibold text-slate-900"
          id="intervention-areas-heading"
        >
          Potential Intervention Areas
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          These deterministic evidence screens identify areas for further
          investigation. They do not establish causes or recommend investment.
        </p>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        {signals.map((signal) => {
          const trail =
            signal.intervention === 'irrigation'
              ? getIrrigationEvidenceTrail(signal, evidenceRecords)
              : undefined
          const trailAvailable = trail?.status === 'available'
          const supported =
            signal.status === 'supported' &&
            (signal.intervention !== 'irrigation' || trailAvailable)
          const insufficient =
            signal.intervention === 'irrigation' && !trailAvailable

          return (
            <article
              className={`min-w-0 rounded-xl border p-4 sm:p-5 ${
                supported
                  ? 'border-green-200 bg-green-50/70'
                  : 'border-slate-200 bg-white'
              }`}
              key={signal.intervention}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 text-sm font-semibold text-slate-900">
                  {signal.title || interventionLabels[signal.intervention]}
                </h3>
                <span
                  className={`inline-flex min-h-7 shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
                    supported
                      ? 'bg-white text-green-800 ring-green-200'
                      : 'bg-slate-100 text-slate-700 ring-slate-200'
                  }`}
                >
                  {supported
                    ? 'Investigation signal'
                    : insufficient
                      ? 'Insufficient connected NISR evidence'
                      : signal.intervention === 'irrigation'
                        ? 'Signal conditions not met'
                        : 'Evidence insufficient'}
                </span>
              </div>

              {(supported ||
                (signal.intervention === 'irrigation' &&
                  trailAvailable &&
                  signal.status !== 'supported')) && (
                <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700">
                  {signal.rationale.map((reason) => (
                    <li className="flex gap-2" key={reason}>
                      <span
                        aria-hidden="true"
                        className={`mt-2 size-1.5 shrink-0 rounded-full ${
                          supported ? 'bg-green-700' : 'bg-slate-400'
                        }`}
                      />
                      <span className="min-w-0 break-words">{reason}</span>
                    </li>
                  ))}
                </ul>
              )}

              {supported && trail?.status === 'available' ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-green-200 pt-3">
                  <p className="text-xs text-slate-600">
                    {trail.evidenceIds.length} connected NISR observations
                    support this screen.
                  </p>
                </div>
              ) : insufficient ? (
                <p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-700">
                  Insufficient connected NISR evidence. The signal is not shown
                  unless all four same-period observations and their source
                  references are available.
                </p>
              ) : signal.intervention === 'irrigation' ? (
                <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">
                  The connected observations do not meet both conditions for
                  this investigation signal.
                </p>
              ) : (
                <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                  No connected evidence currently supports a district-specific
                  intervention signal.
                </p>
              )}

              {supported && trail?.status === 'available' && (
                <IrrigationEvidenceTrailContent
                  irrigationDifference={trail.irrigationDifference}
                  onNavigateMethodology={onNavigateMethodology}
                  onOpenEvidence={onOpenEvidence}
                  signal={signal}
                  trailRecords={trail.records}
                  yieldDifference={trail.yieldDifference}
                />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
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
  crop,
  season,
  selectedDistrict,
  year,
  onOpenEvidence,
  onNavigateOverview,
  onNavigateMethodology,
}: DistrictProfilePageProps) {
  const hasConnectedPeriod =
    crop === 'maize' && season === 'season-a' && year === '2024-25'
  const candidate = selectedDistrict
    ? getDistrictInsight(selectedDistrict)
    : undefined
  const insight =
    hasConnectedPeriod && candidate?.source.kind === 'nisr'
      ? candidate
      : undefined

  if (!selectedDistrict) {
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
          its profile. This page displays only district observations in the
          connected NISR source.
        </p>
        <button
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          onClick={onNavigateOverview}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Overview
        </button>
      </section>
    )
  }

  const period = {
    district: selectedDistrict,
    crop: getCropLabel(crop),
    year: year.replace('-', '/'),
    season: getSeasonCode(season),
  }
  const interventionSignals = calculateInterventionSignals(
    evidenceRecords,
    period,
  )

  if (!insight || insight.source.kind !== 'nisr') {
    const metadata = getDistrictMetadata(selectedDistrict)

    return (
      <div className="space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              onClick={onNavigateOverview}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to Overview
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              onClick={() => onOpenEvidence()}
              type="button"
            >
              Explore evidence
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="border-b border-slate-200 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-green-800">
              District profile
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {selectedDistrict}
              </h1>
              {metadata && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin aria-hidden="true" className="size-4" />
                  {metadata.province}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {period.crop} · Season {period.season} · Agricultural year{' '}
              {period.year}
            </p>
          </div>
        </header>

        <section
          aria-label="District observations unavailable"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"
        >
          <EvidenceStatusBadge status="unavailable" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            No connected district observations for this period
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            AII currently connects district maize observations for Season A,
            2024/25. No value is carried forward from another year, season, or
            crop.
          </p>
        </section>

        <InterventionAreas
          onNavigateMethodology={onNavigateMethodology}
          onOpenEvidence={onOpenEvidence}
          signals={interventionSignals}
        />
      </div>
    )
  }

  const metadata = getDistrictMetadata(insight.district)
  const source = insight.source
  const signal = insight.interventionSignal

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={onNavigateOverview}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to Overview
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={() => onOpenEvidence()}
            type="button"
          >
            Explore evidence
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>

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
                className="text-base font-semibold text-slate-900"
                id="district-signal-heading"
              >
                Productivity signal
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
            className="text-base font-semibold text-slate-900"
            id="productivity-heading"
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
            className="text-base font-semibold text-slate-900"
            id="yield-trend-heading"
          >
            Yield trend
          </h2>
        </div>
        <p className="border-l-2 border-slate-300 py-1 pl-4 text-sm leading-6 text-slate-600">
          Historical SAS 2024 district values are published but are not
          connected to this profile. A trend is unavailable until comparable
          source records are added.
        </p>
      </section>

      <section aria-labelledby="signal-evidence-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-base font-semibold text-slate-900"
              id="signal-evidence-heading"
            >
              Evidence behind the signal
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Yield gap = (district yield − national reference) ÷ national
              reference × 100. Both input yields are observed in SAS 2025 Table
              19, p. 56; the gap is derived.
            </p>
          </div>
          <EvidenceStatusBadge status="derived" />
        </div>
        <button
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          onClick={() => onOpenEvidence()}
          type="button"
        >
          View district evidence records
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </section>

      <InterventionAreas
        onNavigateMethodology={onNavigateMethodology}
        onOpenEvidence={onOpenEvidence}
        signals={interventionSignals}
      />

      <p className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        Source:{' '}
        <a
          className="font-medium text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950"
          href={source.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          {source.report}
        </a>
        , SAS 2025 Tables 13, 19, and 24. Irrigation context is reported in
        Table 64. Data &amp; Methodology explains the comparison boundaries and
        limitations.
      </p>
    </div>
  )
}
