import { useMemo } from 'react'
import { ArrowUpRight, CircleHelp } from 'lucide-react'

import { EvidenceIndicatorIcon } from '../../evidence/components/EvidenceIndicatorIcon'
import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { AgriculturalSeason } from '../../../types/data-contract'
import { getDistrictYieldHistory } from '../utils/districtYieldHistory'

function formatYield(value: number, unit: string): string {
  return `${value.toLocaleString('en-RW', { maximumFractionDigits: 1 })} ${unit}`
}

function sourceLabel(record: EvidenceRecord): string {
  return `${record.dataset} · ${record.sourceReference.table}${record.sourceReference.page ? ` · p. ${record.sourceReference.page}` : ''}`
}

export function DistrictYieldHistoryChart({
  district,
  crop,
  season,
  year,
}: {
  readonly district: string
  readonly crop: string
  readonly season: AgriculturalSeason
  readonly year: string
}) {
  const selection = useMemo(
    () =>
      getDistrictYieldHistory(evidenceRecords, district, crop, season, year),
    [crop, district, season, year],
  )
  const headingId = `district-yield-history-${district.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
  const yearLabel = year.replace('-', '/')

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-2">
        <EvidenceIndicatorIcon
          className="mt-0.5 size-4 shrink-0 text-agri-700"
          indicator="average_yield"
        />
        <div className="min-w-0">
          <h2
            className="text-base font-semibold text-forest-950"
            id={headingId}
          >
            Observed district yield over time
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {district} · {crop} · Season {season} · through {yearLabel} · Kg/Ha
          </p>
        </div>
      </div>

      {selection.status !== 'available' ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-slate-300 p-3">
          {selection.status === 'insufficient' ? (
            <CircleHelp
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-slate-500"
            />
          ) : (
            <EvidenceStatusBadge status="unavailable" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-700" role="status">
              {selection.message} No chart is drawn.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {selection.detail}
            </p>
          </div>
        </div>
      ) : (
        <YieldHistoryPlot
          records={selection.records}
        />
      )}
    </section>
  )
}

function YieldHistoryPlot({
  records,
}: {
  readonly records: readonly EvidenceRecord[]
}) {
  const maximum = records.reduce(
    (largest, record) =>
      record.value !== null ? Math.max(largest, record.value) : largest,
    0,
  )

  return (
    <>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        Each bar starts at 0; the shared scale ends at{' '}
        {maximum.toLocaleString('en-RW')} Kg/Ha. Only reported years are shown.
      </p>
      <ul
        aria-label="Reported yield by agricultural year"
        className="mt-3 space-y-3"
      >
        {records.map((record) => (
          <li className="min-w-0" key={record.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-slate-700">
                {record.period.year}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {record.value === null
                  ? 'Unavailable'
                  : formatYield(record.value, record.unit)}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-agri-700"
                style={{
                  width:
                    record.value === null || maximum === 0
                      ? '0%'
                      : `${(record.value / maximum) * 100}%`,
                }}
              />
            </div>
            <div className="mt-1 break-words text-xs text-slate-600">
              <a
                className="inline-flex min-h-8 max-w-full items-center gap-1 text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                href={record.source.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {sourceLabel(record)}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
