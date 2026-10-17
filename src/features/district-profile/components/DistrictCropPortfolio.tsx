import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useId } from 'react'

import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { DistrictComparisonBar } from './DistrictComparisonBar'
import {
  districtCropPortfolioIndicators,
  getDistrictCropPortfolio,
  type DistrictCropPortfolioEntry,
  type DistrictCropPortfolioMetric,
} from '../utils/districtCropPortfolio'

interface DistrictCropPortfolioProps {
  district: string
  year: string
  season: string
  onOpenEvidence: (evidenceIds: readonly string[]) => void
}

function formatValue(record: EvidenceRecord): string {
  if (
    record.status !== 'observed' ||
    record.value === null ||
    !Number.isFinite(record.value)
  ) {
    return 'Unavailable'
  }

  return `${record.value.toLocaleString('en-RW', {
    maximumFractionDigits: 2,
  })} ${record.unit}`
}

function observedValue(record: EvidenceRecord | undefined): number | undefined {
  return record?.status === 'observed' &&
    record.value !== null &&
    Number.isFinite(record.value)
    ? record.value
    : undefined
}

function SourceProvenance({ record }: { record: EvidenceRecord }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="break-words text-xs font-semibold text-slate-800">
        {record.geography.name} · {record.dataset} · {record.period.year} ·
        Season {record.period.season}
      </p>
      <dl className="mt-2 grid min-w-0 gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="font-medium text-slate-500">Report</dt>
        <dd className="min-w-0 break-words text-slate-700">
          {record.source.report}
        </dd>
        <dt className="font-medium text-slate-500">Crop label</dt>
        <dd className="min-w-0 break-words text-slate-700">
          {record.crop}
          {record.sourceCrop ? ` · source: ${record.sourceCrop}` : ''}
        </dd>
        <dt className="font-medium text-slate-500">Source table</dt>
        <dd className="min-w-0 break-words text-slate-700">
          {record.sourceReference.table}
          {record.sourceReference.page !== undefined &&
            ` · p. ${record.sourceReference.page}`}
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
        <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
      </a>
    </div>
  )
}

function Observation({
  label,
  record,
  records,
  unmatched,
}: {
  label: string
  record?: EvidenceRecord
  records: readonly EvidenceRecord[]
  unmatched?: boolean
}) {
  const ambiguous = !record && records.length > 1

  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
        {record
          ? formatValue(record)
          : ambiguous
            ? 'Multiple source records; value withheld'
            : unmatched
              ? 'No national record with matching source dimensions'
              : 'No record in the selected season'}
      </dd>
      {record && <EvidenceStatusBadge status={record.status} />}
      {ambiguous && <EvidenceStatusBadge status="unavailable" />}
    </div>
  )
}

function CropMetric({
  metric,
  district,
}: {
  metric: DistrictCropPortfolioMetric
  district: string
}) {
  const metricId = useId()
  const formattedDifference = metric.difference?.toLocaleString('en-RW', {
    maximumFractionDigits: 2,
    signDisplay: 'always',
  })
  const districtValue = observedValue(metric.districtRecord)
  const nationalValue = observedValue(metric.nationalRecord)
  const showYieldComparison =
    metric.indicator === 'average_yield' &&
    districtValue !== undefined &&
    nationalValue !== undefined &&
    metric.difference !== undefined

  return (
    <section
      aria-labelledby={metricId}
      className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3"
    >
      <h4 className="text-sm font-semibold text-slate-900" id={metricId}>
        {metric.label} ({metric.unit})
      </h4>
      {showYieldComparison ? (
        <div className="mt-3">
          <DistrictComparisonBar
            difference={metric.difference}
            districtName={district}
            districtValue={districtValue}
            label={`${district} ${metric.label.toLowerCase()}`}
            nationalValue={nationalValue}
            unit={metric.unit}
          />
        </div>
      ) : (
        <dl className="mt-3 space-y-3">
          <Observation
            label={`District · ${district}`}
            record={metric.districtRecord}
            records={metric.districtRecords}
          />
          <Observation
            label="National reference · Rwanda"
            record={metric.nationalRecord}
            records={metric.nationalRecords}
            unmatched={metric.hasUnmatchedNationalRecords}
          />
          <div>
            <dt className="text-xs text-slate-500">
              District − national · derived
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
              {formattedDifference === undefined
                ? 'Unavailable'
                : `${formattedDifference} ${metric.unit}`}
            </dd>
            <EvidenceStatusBadge
              status={
                formattedDifference === undefined ? 'unavailable' : 'derived'
              }
            />
          </div>
        </dl>
      )}
    </section>
  )
}

function CropCard({
  entry,
  district,
  onOpenEvidence,
}: {
  entry: DistrictCropPortfolioEntry
  district: string
  onOpenEvidence: (evidenceIds: readonly string[]) => void
}) {
  const headingId = useId()
  const sourceRecords = [
    ...new Map(
      districtCropPortfolioIndicators.flatMap((indicator) => {
        const metric = entry.metrics[indicator]
        return [...metric.districtRecords, ...metric.nationalRecords].map(
          (record) => [record.id, record] as const,
        )
      }),
    ).values(),
  ]

  return (
    <article
      aria-labelledby={headingId}
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900" id={headingId}>
          {entry.crop}
        </h3>
        {entry.evidenceIds.length > 0 && (
          <button
            className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={() => onOpenEvidence(entry.evidenceIds)}
            type="button"
          >
            View crop evidence in Evidence Explorer
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
      <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-3">
        {districtCropPortfolioIndicators.map((indicator) => (
          <CropMetric
            district={district}
            key={indicator}
            metric={entry.metrics[indicator]}
          />
        ))}
      </div>
      {sourceRecords.length > 0 && (
        <details className="mt-3 border-t border-slate-100 pt-2">
          <summary className="min-h-9 cursor-pointer content-center text-xs font-semibold text-green-800 underline decoration-green-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
            Source records and provenance
          </summary>
          <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
            {sourceRecords.map((record) => (
              <SourceProvenance key={record.id} record={record} />
            ))}
          </div>
        </details>
      )}
    </article>
  )
}

export function DistrictCropPortfolio({
  district,
  year,
  season,
  onOpenEvidence,
}: DistrictCropPortfolioProps) {
  const headingId = useId()
  const portfolio = getDistrictCropPortfolio(
    evidenceRecords,
    district,
    year,
    season,
  )

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-forest-950" id={headingId}>
          District crop portfolio &amp; productivity
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          Observed cultivated area, production, and yield for each connected
          crop, with a national reference only where source definitions match.
          Each crop category is shown separately; values are not aggregated.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {year} · Season {season} · The portfolio includes all connected crops
          for this district and period, independent of the Overview crop filter.
        </p>
      </div>

      {portfolio.length === 0 ? (
        <div
          aria-label="District crop portfolio unavailable"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-4"
        >
          <EvidenceStatusBadge status="unavailable" />
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No district crop records are connected for this SAS year and season.
            A crop absent from the source tables is not represented as an
            unavailable observation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {portfolio.map((entry) => (
            <CropCard
              district={district}
              entry={entry}
              key={`${entry.crop}|${entry.species ?? ''}|${entry.category ?? ''}`}
              onOpenEvidence={onOpenEvidence}
            />
          ))}
        </div>
      )}
    </section>
  )
}
