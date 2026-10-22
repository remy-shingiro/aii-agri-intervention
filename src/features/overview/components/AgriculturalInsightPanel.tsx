import { useMemo } from 'react'
import { ArrowRight, FileSearch } from 'lucide-react'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { ProductivityGapStatus } from '../../../types/agricultural-signal'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { getDistrictInsights } from '../data/districtInsights'

interface AgriculturalInsightPanelProps {
  crop: string
  season: string
  selectedDistrict?: string
  year: string
  onOpenDistrictProfile: () => void
  onOpenInvestigationBrief: () => void
  onOpenEvidence: () => void
}

function getSignalLabel(status: ProductivityGapStatus): string {
  switch (status) {
    case 'below_reference':
      return 'Below national reference'
    case 'at_reference':
      return 'At national reference'
    case 'above_reference':
      return 'Above national reference'
    case 'insufficient_evidence':
      return 'Insufficient evidence'
  }
}

function getSignalClasses(status: ProductivityGapStatus): string {
  switch (status) {
    case 'below_reference':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
    case 'at_reference':
      return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200'
    case 'above_reference':
      return 'bg-green-50 text-green-800 ring-1 ring-green-200'
    case 'insufficient_evidence':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
  }
}

function observedValue(record: EvidenceRecord | undefined): number | undefined {
  return record?.status === 'observed' && record.value !== null
    ? record.value
    : undefined
}

function formatYield(value: number): string {
  return `${(value / 1000).toFixed(2)} t/ha`
}

function formatYieldRecord(record: EvidenceRecord | undefined): string {
  const value = observedValue(record)
  return value === undefined ? 'Unavailable' : formatYield(value)
}

function formatValue(record: EvidenceRecord | undefined): string {
  const value = observedValue(record)
  if (value === undefined || !record) return 'Unavailable'
  const formatted = value.toLocaleString('en-RW', { maximumFractionDigits: 1 })
  return `${formatted} ${record.unit === 'MT' ? 'tonnes' : record.unit.toLowerCase()}`
}

export function AgriculturalInsightPanel({
  crop,
  season,
  selectedDistrict,
  year,
  onOpenDistrictProfile,
  onOpenInvestigationBrief,
  onOpenEvidence,
}: AgriculturalInsightPanelProps) {
  const periodInsights = useMemo(
    () => getDistrictInsights(crop, season, year),
    [crop, season, year],
  )
  const insight = useMemo(
    () =>
      selectedDistrict
        ? periodInsights.find(
            (item) =>
              item.district.trim().toLowerCase() ===
              selectedDistrict.trim().toLowerCase(),
          )
        : undefined,
    [periodInsights, selectedDistrict],
  )
  const districtIrrigation = insight
    ? evidenceRecords.find(
        (record) =>
          record.dataset === insight.source.dataset &&
          record.indicator === 'irrigation_practice' &&
          record.geography.level === 'district' &&
          record.geography.id === insight.districtYieldRecord.geography.id &&
          record.period.year === insight.districtYieldRecord.period.year &&
          record.period.season === insight.districtYieldRecord.period.season,
      )
    : undefined
  const nationalIrrigation = insight
    ? evidenceRecords.find(
        (record) =>
          record.dataset === insight.source.dataset &&
          record.indicator === 'irrigation_practice' &&
          record.geography.level === 'national' &&
          record.period.year === insight.districtYieldRecord.period.year &&
          record.period.season === insight.districtYieldRecord.period.season,
      )
    : undefined
  const districtIrrigationValue = observedValue(districtIrrigation)
  const nationalIrrigationValue = observedValue(nationalIrrigation)
  const supportsSelectedPeriod = periodInsights.length > 0

  return (
    <aside
      aria-label="District agricultural evidence"
      className="min-w-0 xl:h-full"
    >
      <section className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-agri-700">
              {selectedDistrict ? 'District evidence' : 'Data in view'}
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-forest-950">
              {insight
                ? insight.productivityGap.status === 'insufficient_evidence'
                  ? 'Productivity evidence'
                  : 'Productivity comparison'
                : selectedDistrict && supportsSelectedPeriod
                  ? 'District data unavailable'
                  : supportsSelectedPeriod
                    ? 'Select a district'
                    : 'No data for this period'}
            </h2>
          </div>

          {insight && (
            <span
              className={`inline-flex min-h-7 shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getSignalClasses(insight.productivityGap.status)}`}
            >
              {getSignalLabel(insight.productivityGap.status)}
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
                District − national yield · derived
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-forest-950 tabular-nums">
                {insight.productivityGap.absoluteGap?.toLocaleString('en-RW') ??
                  'Unavailable'}{' '}
                {insight.productivityGap.unit ?? ''}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Relative gap:{' '}
                {insight.productivityGap.relativeGapPct === undefined
                  ? 'Unavailable'
                  : `${insight.productivityGap.relativeGapPct > 0 ? '+' : ''}${insight.productivityGap.relativeGapPct.toFixed(1)}%`}
                {' · '}derived from the observed district and national values in
                the same NISR dataset and period.
              </p>
            </div>

            <dl className="grid grid-cols-2 divide-x divide-slate-200 py-4">
              <div className="pr-3">
                <dt className="text-xs text-slate-500">
                  District yield · observed
                </dt>
                <dd className="mt-1 text-lg font-bold text-forest-950 tabular-nums">
                  {formatYieldRecord(insight.districtYieldRecord)}
                </dd>
              </div>
              <div className="pl-4">
                <dt className="text-xs text-slate-500">
                  National reference · observed
                </dt>
                <dd className="mt-1 text-lg font-bold text-forest-950 tabular-nums">
                  {formatYieldRecord(insight.nationalYieldRecord)}
                </dd>
              </div>
            </dl>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-200 py-4">
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">
                  Production · observed
                </dt>
                <dd className="mt-1 text-lg font-bold text-forest-950 tabular-nums">
                  {formatValue(insight.productionRecord)}
                </dd>
                {insight.productionRecord && (
                  <dd className="mt-1 text-[11px] leading-4 text-slate-500">
                    {insight.productionRecord.sourceReference.table}
                  </dd>
                )}
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">
                  Cultivated area · observed
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                  {formatValue(insight.areaRecord)}
                </dd>
                {insight.areaRecord && (
                  <dd className="mt-1 text-[11px] leading-4 text-slate-500">
                    {insight.areaRecord.sourceReference.table}
                  </dd>
                )}
              </div>
              <div className="col-span-2 min-w-0 border-t border-slate-100 pt-3">
                <dt className="text-xs text-slate-500">
                  District-wide irrigation practice · observed
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
                  {districtIrrigationValue !== undefined
                    ? `${districtIrrigationValue.toFixed(1)}%`
                    : 'Unavailable'}
                </dd>
                {districtIrrigation && (
                  <dd className="mt-1 text-[11px] leading-4 text-slate-500">
                    {districtIrrigation.sourceReference.table}
                  </dd>
                )}
                <dd className="mt-2 text-xs text-slate-500">
                  National reference:{' '}
                  {nationalIrrigationValue !== undefined
                    ? `${nationalIrrigationValue.toFixed(1)}%`
                    : 'Unavailable'}
                  {districtIrrigationValue !== undefined &&
                    nationalIrrigationValue !== undefined &&
                    districtIrrigation?.unit === nationalIrrigation?.unit &&
                    ` · Difference: ${(districtIrrigationValue - nationalIrrigationValue).toFixed(1)} percentage points`}
                </dd>
              </div>
            </dl>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <button
                className="inline-flex min-h-11 items-center justify-between rounded-lg bg-forest-950 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
                onClick={onOpenInvestigationBrief}
                type="button"
              >
                Prepare investigation brief
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-between rounded-lg border border-slate-300 px-3.5 text-sm font-semibold text-forest-950 transition-colors hover:border-agri-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
                onClick={onOpenDistrictProfile}
                type="button"
              >
                Open district profile
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-between rounded-lg border border-slate-300 px-3.5 text-sm font-semibold text-forest-950 transition-colors hover:border-agri-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
                onClick={onOpenEvidence}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <FileSearch aria-hidden="true" className="size-4" />
                  View evidence
                </span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm leading-6 text-slate-600">
              {supportsSelectedPeriod
                ? 'No observed district yield is connected for this selection. No district or national value is substituted.'
                : 'There are no observed district yield rows for this crop, season, and agricultural year.'}
            </p>
            {!selectedDistrict && supportsSelectedPeriod && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                Select a district on the map or use district search to review
                its evidence.
              </p>
            )}
          </div>
        )}

        {insight && (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Source
            </p>
            <a
              className="mt-1 inline-block text-sm font-medium text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950"
              href={insight.source.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {insight.source.report}
            </a>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {insight.districtYieldRecord.sourceReference.table}
              {insight.districtYieldRecord.sourceReference.page !== undefined &&
                ` · p. ${insight.districtYieldRecord.sourceReference.page}`}
            </p>
          </div>
        )}

        {!insight && selectedDistrict && (
          <button
            className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-300 px-3.5 text-sm font-semibold text-forest-950 transition-colors hover:border-agri-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
            onClick={onOpenInvestigationBrief}
            type="button"
          >
            Prepare investigation brief
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        )}
      </section>
    </aside>
  )
}
