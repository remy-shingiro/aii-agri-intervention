import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useId } from 'react'

import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { EvidenceIndicatorIcon } from '../../evidence/components/EvidenceIndicatorIcon'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { getDistrictSeasonalPracticeProfile } from '../utils/districtSeasonalPracticeProfile'
import { DistrictComparisonBar } from './DistrictComparisonBar'

interface DistrictSeasonalPracticeProfileProps {
  district: string
  year: string
  season: string
  onOpenEvidence: (evidenceIds: readonly string[]) => void
}

function ObservationValue({
  record,
  geographyLabel,
}: {
  record?: EvidenceRecord
  geographyLabel: string
}) {
  const isObserved =
    record?.status === 'observed' &&
    record.value !== null &&
    Number.isFinite(record.value)

  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{geographyLabel} · observed</dt>
      <dd className="mt-1 break-words text-lg font-semibold tabular-nums text-slate-900">
        {isObserved
          ? `${record.value.toLocaleString('en-RW', { maximumFractionDigits: 2 })} ${record.unit}`
          : 'Unavailable'}
      </dd>
      <EvidenceStatusBadge status={isObserved ? 'observed' : 'unavailable'} />
    </div>
  )
}

function SourceProvenance({ record }: { record: EvidenceRecord }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-800">
        {record.geography.name} · {record.dataset}
      </p>
      <p className="mt-1 break-words text-xs leading-5 text-slate-600">
        {record.source.report}
      </p>
      <p className="mt-1 break-words text-xs leading-5 text-slate-600">
        {record.sourceReference.table}
        {record.sourceReference.page !== undefined &&
          ` · p. ${record.sourceReference.page}`}
      </p>
      <p className="mt-1 break-all font-mono text-[11px] leading-5 text-slate-500">
        Evidence ID: {record.id}
      </p>
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

export function DistrictSeasonalPracticeProfile({
  district,
  year,
  season,
  onOpenEvidence,
}: DistrictSeasonalPracticeProfileProps) {
  const headingId = useId()
  const practices = getDistrictSeasonalPracticeProfile(
    evidenceRecords,
    district,
    year,
    season,
  )
  const hasAnyRecords = practices.some(
    (practice) => practice.districtRecord || practice.nationalRecord,
  )

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-forest-950" id={headingId}>
          District-wide seasonal practice profile
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          These SAS measures describe practices across district agricultural
          activity, not a selected crop. Differences are derived as district
          minus Rwanda and do not show cause or impact.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Selected period: {year} · Season {season}
        </p>
      </div>

      {!hasAnyRecords && (
        <div
          aria-label="District-wide practice evidence unavailable"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-4"
        >
          <EvidenceStatusBadge status="unavailable" />
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No matching SAS practice records are connected for this district,
            year, and season.
          </p>
        </div>
      )}

      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {practices.map((practice) => {
          const rowHeadingId = `${headingId}-${practice.indicator}`
          const difference = practice.difference
          const districtValue =
            practice.districtRecord?.status === 'observed' &&
            practice.districtRecord.value !== null &&
            Number.isFinite(practice.districtRecord.value)
              ? practice.districtRecord.value
              : undefined
          const nationalValue =
            practice.nationalRecord?.status === 'observed' &&
            practice.nationalRecord.value !== null &&
            Number.isFinite(practice.nationalRecord.value)
              ? practice.nationalRecord.value
              : undefined
          const hasComparablePair =
            districtValue !== undefined &&
            nationalValue !== undefined &&
            difference !== undefined
          const formattedDifference = difference?.toLocaleString('en-RW', {
            maximumFractionDigits: 2,
            signDisplay: 'always',
          })

          return (
            <article
              aria-labelledby={rowHeadingId}
              className="min-w-0 p-4 sm:p-5"
              key={practice.indicator}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                    id={rowHeadingId}
                  >
                    <EvidenceIndicatorIcon
                      className="size-4 shrink-0 text-agri-700"
                      indicator={practice.indicator}
                    />
                    {practice.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    District-wide practice · all crop activity
                  </p>
                </div>
                {practice.evidenceIds.length > 0 && (
                  <button
                    className="inline-flex min-h-10 min-w-0 max-w-full flex-wrap items-center gap-1 rounded-md px-2 text-left text-xs font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                    onClick={() => onOpenEvidence(practice.evidenceIds)}
                    type="button"
                  >
                    View provenance in Evidence Explorer
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>

              {hasComparablePair ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <DistrictComparisonBar
                    difference={difference}
                    differenceUnit="percentage points"
                    districtName={district}
                    districtValue={districtValue}
                    label={practice.label}
                    nationalValue={nationalValue}
                    scaleMaximum={100}
                    unit="%"
                  />
                </div>
              ) : (
                <dl className="mt-3 grid min-w-0 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                  <ObservationValue
                    geographyLabel={`District · ${district}`}
                    record={practice.districtRecord}
                  />
                  <ObservationValue
                    geographyLabel="National reference · Rwanda"
                    record={practice.nationalRecord}
                  />
                  <div className="min-w-0 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <dt className="text-xs text-slate-500">
                      District − national · derived
                    </dt>
                    <dd className="mt-1 break-words text-base font-semibold tabular-nums text-slate-900">
                      {formattedDifference === undefined
                        ? 'Unavailable'
                        : `${formattedDifference} percentage points`}
                    </dd>
                    <EvidenceStatusBadge
                      status={
                        formattedDifference === undefined
                          ? 'unavailable'
                          : 'derived'
                      }
                    />
                  </div>
                </dl>
              )}

              {(practice.districtRecord || practice.nationalRecord) && (
                <details className="mt-3 border-t border-slate-100 pt-3">
                  <summary className="min-h-9 cursor-pointer content-center text-xs font-semibold text-green-800 underline decoration-green-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">
                    Source records and provenance
                  </summary>
                  <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
                    {practice.districtRecord && (
                      <SourceProvenance record={practice.districtRecord} />
                    )}
                    {practice.nationalRecord && (
                      <SourceProvenance record={practice.nationalRecord} />
                    )}
                  </div>
                </details>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
