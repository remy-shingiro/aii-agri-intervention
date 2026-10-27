import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useId } from 'react'

import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { EvidenceIndicatorIcon } from '../../evidence/components/EvidenceIndicatorIcon'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { DistrictComparisonBar } from './DistrictComparisonBar'
import {
  districtCropPortfolioIndicators,
  getDistrictCropPortfolio,
  rankObservedDistrictCropYields,
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
      <h4
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"
        id={metricId}
      >
        <EvidenceIndicatorIcon
          className="size-4 shrink-0 text-agri-700"
          indicator={metric.indicator}
        />
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

function ObservedCropYieldChart({
  district,
  year,
  season,
  portfolio,
  onOpenEvidence,
}: {
  district: string
  year: string
  season: string
  portfolio: readonly DistrictCropPortfolioEntry[]
  onOpenEvidence: (evidenceIds: readonly string[]) => void
}) {
  const ranking = rankObservedDistrictCropYields(portfolio)
  const maximum = Math.max(
    0,
    ...ranking.observations.map((observation) => observation.value),
  )
  const formatter = new Intl.NumberFormat('en-RW', {
    maximumFractionDigits: 2,
  })
  const omittedCount =
    ranking.missingOrAmbiguousCount +
    ranking.unavailableCount +
    ranking.invalidCount

  return (
    <section
      aria-labelledby="district-crop-yield-chart-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-2">
        <EvidenceIndicatorIcon
          className="mt-0.5 size-4 shrink-0 text-agri-700"
          indicator="average_yield"
        />
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold text-slate-900"
            id="district-crop-yield-chart-heading"
          >
            Observed yield by crop
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {district} Â· {year} Â· Season {season} Â· Kg/Ha
          </p>
        </div>
      </div>

      {ranking.observations.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3">
          <EvidenceStatusBadge status="unavailable" />
          <p className="mt-2 text-sm leading-5 text-slate-600">
            No uniquely observed district yields are available to rank for this
            period. The {ranking.portfolioCropCount} portfolio crop categories
            remain listed below with their individual availability states.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Ranked highest to lowest: {ranking.observations.length} of{' '}
            {ranking.portfolioCropCount} crop categories have one observed
            district yield. {omittedCount} categories with missing, ambiguous,
            unavailable, or invalid yields are not plotted.
          </p>
          <div
            aria-hidden="true"
            className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] text-[11px] text-slate-500 sm:grid-cols-[minmax(0,1fr)_minmax(5rem,2fr)_auto]"
          >
            <span className="col-span-2 flex justify-between sm:col-span-1 sm:col-start-2 sm:row-start-1">
              <span>0 Kg/Ha</span>
              <span>{formatter.format(maximum)} Kg/Ha</span>
            </span>
          </div>
          <ol
            aria-label={`Observed ${district} crop yields, ranked highest to lowest`}
            className="mt-1 space-y-2"
          >
            {ranking.observations.map((observation) => {
              const width =
                maximum > 0 ? (observation.value / maximum) * 100 : 0

              return (
                <li
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(5rem,2fr)_auto]"
                  key={observation.record.id}
                >
                  <button
                    aria-label={`View ${observation.label} yield evidence`}
                    className="inline-flex min-w-0 items-center gap-1 truncate text-left text-xs font-medium text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                    onClick={() => onOpenEvidence([observation.record.id])}
                    type="button"
                  >
                    <span className="truncate">{observation.label}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3 shrink-0"
                    />
                  </button>
                  <span className="text-right text-xs font-semibold tabular-nums text-slate-800 sm:col-start-3 sm:row-start-1">
                    {formatter.format(observation.value)} {observation.unit}
                  </span>
                  <div
                    aria-hidden="true"
                    className="col-span-2 h-2 overflow-hidden rounded-sm bg-slate-100 sm:col-span-1 sm:col-start-2 sm:row-start-1"
                  >
                    <div
                      className="h-full bg-agri-700"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-500">
            Bars use a shared 0 to {formatter.format(maximum)} Kg/Ha scale.
            Select a crop label to open its connected observation and NISR
            source reference.
          </p>
        </>
      )}
    </section>
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
        <>
          <ObservedCropYieldChart
            district={district}
            onOpenEvidence={onOpenEvidence}
            portfolio={portfolio}
            season={season}
            year={year}
          />
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
        </>
      )}
    </section>
  )
}
