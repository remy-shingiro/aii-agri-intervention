import { ArrowUpRight } from 'lucide-react'

import type { EvidenceRecord } from '../types/evidence.types'
import { EvidenceStatusBadge } from './EvidenceStatusBadge'

interface EvidenceRecordCardProps {
  record: EvidenceRecord
  onOpenDistrictProfile: (district: string) => void
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) {
    return 'Unavailable'
  }

  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: unit === '%' ? 1 : 0,
  })

  return `${formatted} ${unit}`
}

function formatDifference(value: number, unit: string): string {
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  })

  return `${formatted} ${unit}`
}

export function EvidenceRecordCard({
  record,
  onOpenDistrictProfile,
}: EvidenceRecordCardProps) {
  const reference = record.sourceReference

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
            {record.label}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            {record.geography.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {record.geography.level === 'national'
              ? 'National · '
              : record.geography.level === 'province'
                ? 'Province · '
                : record.crop
                  ? `${record.crop} · `
                  : 'All crop activity · '}
            {record.species ? `${record.species} · ` : ''}
            {record.period.season
              ? `Season ${record.period.season} · `
              : `${record.period.label ?? 'Annual, no SAS season'} · `}
            {record.period.year}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <EvidenceStatusBadge status={record.status} />
          {record.comparisonStatus && (
            <EvidenceStatusBadge status={record.comparisonStatus} />
          )}
        </div>
      </div>

      <dl className="mt-4 grid gap-x-4 gap-y-3 border-y border-slate-100 py-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Value</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            {formatValue(record.value, record.unit)}
          </dd>
        </div>
        {record.referenceValue !== undefined && (
          <div>
            <dt className="text-xs text-slate-500">
              {record.referenceLabel ?? 'Reference'}
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
              {formatValue(record.referenceValue, record.unit)}
            </dd>
          </div>
        )}
        {record.difference !== undefined && record.differenceUnit && (
          <div>
            <dt className="text-xs text-slate-500">Calculated difference</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
              {formatDifference(record.difference, record.differenceUnit)}
            </dd>
          </div>
        )}
      </dl>

      {record.sourceCrop && record.sourceCrop !== record.crop && (
        <p className="mt-3 text-xs text-slate-500">
          Source crop label: <span className="font-medium text-slate-700">{record.sourceCrop}</span>
        </p>
      )}

      {record.derivedFromEvidenceIds && (
        <p className="mt-3 break-words text-xs leading-5 text-slate-500">
          Derived from evidence records:{' '}
          <span className="font-medium text-slate-700">
            {record.derivedFromEvidenceIds.join(', ')}
          </span>
        </p>
      )}
      {record.referenceEvidenceId && (
        <p className="mt-3 break-words text-xs leading-5 text-slate-500">
          Comparison reference record:{' '}
          <span className="font-medium text-slate-700">
            {record.referenceEvidenceId}
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700">{record.dataset}</p>
          <p className="mt-1 text-[11px] text-slate-500">{record.source.report}</p>
          <a
            className="mt-1 inline-flex max-w-full items-center gap-1 text-xs leading-5 text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950"
            href={record.source.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span className="break-words">{reference.table}</span>
            {reference.page !== undefined && <span>· p. {reference.page}</span>}
            <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
        </div>
        {record.geography.level === 'district' && (
          <button
            className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={() => onOpenDistrictProfile(record.geography.name)}
            type="button"
          >
            Open profile
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
    </article>
  )
}
