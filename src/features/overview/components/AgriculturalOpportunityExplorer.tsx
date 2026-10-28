import { ArrowUpRight, FileSearch } from 'lucide-react'

import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { AgriculturalSeason } from '../../../types/data-contract'
import {
  getAgriculturalOpportunities,
  type AgriculturalOpportunityComparison,
} from '../utils/agriculturalOpportunityExplorer'

interface AgriculturalOpportunityExplorerProps {
  crop: string
  season: AgriculturalSeason
  year: string
  selectedDistrict?: string
  onOpenDistrictProfile: (district: string) => void
  onOpenEvidence: (district: string, evidenceIds: readonly string[]) => void
}

function formatYield(value: number, unit: string): string {
  return `${value.toLocaleString('en-RW', { maximumFractionDigits: 1 })} ${unit}`
}

function formatDifference(value: number, unit: string): string {
  return `${value.toLocaleString('en-RW', {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  })} ${unit}`
}

function formatSourceReference(
  record: AgriculturalOpportunityComparison['districtRecord'],
): string {
  return `${record.sourceReference.table}${
    record.sourceReference.page !== undefined
      ? ` · p. ${record.sourceReference.page}`
      : ''
  }`
}

function ComparisonCard({
  comparison,
  onOpenDistrictProfile,
  onOpenEvidence,
}: {
  comparison: AgriculturalOpportunityComparison
  onOpenDistrictProfile: (district: string) => void
  onOpenEvidence: (district: string, evidenceIds: readonly string[]) => void
}) {
  const { districtRecord, nationalRecord, difference, unit } = comparison
  const district = districtRecord.geography.name
  const isBelowReference = difference < 0

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 text-sm font-bold text-forest-950">{district}</h4>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isBelowReference
              ? 'bg-amber-100 text-amber-700'
              : 'bg-sage-100 text-forest-900'
          }`}
        >
          {isBelowReference ? 'Below reference' : 'At or above reference'}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
        <div className="min-w-0">
          <dt className="text-[11px] leading-4 text-slate-500">
            Observed district yield
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
            {formatYield(districtRecord.value!, unit)}
          </dd>
          <EvidenceStatusBadge status="observed" />
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] leading-4 text-slate-500">
            Observed national reference
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900">
            {formatYield(nationalRecord.value!, unit)}
          </dd>
          <EvidenceStatusBadge status="observed" />
        </div>
        <div className="col-span-2 border-t border-slate-100 pt-2">
          <dt className="text-[11px] leading-4 text-slate-500">
            Calculated difference · district minus national
          </dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-slate-800">
            {formatDifference(difference, unit)}
            <span className="ml-2 inline-flex align-middle">
              <EvidenceStatusBadge status="derived" />
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500">
        <p className="break-words">
          {districtRecord.dataset} · District source:{' '}
          {formatSourceReference(districtRecord)}
        </p>
        <p className="break-words">
          National source: {formatSourceReference(nationalRecord)}
        </p>
        <a
          className="inline-block font-semibold text-agri-700 underline decoration-green-700/40 underline-offset-2 hover:text-forest-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
          href={districtRecord.source.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open NISR source report
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-forest-950 transition-colors hover:border-agri-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
          onClick={() => onOpenDistrictProfile(district)}
          type="button"
        >
          Open profile for {district}
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </button>
        <button
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-forest-950 transition-colors hover:border-agri-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
          onClick={() =>
            onOpenEvidence(district, [
              districtRecord.id,
              nationalRecord.id,
            ])
          }
          type="button"
        >
          <FileSearch aria-hidden="true" className="size-3.5" />
          Review opportunity evidence for {district}
        </button>
      </div>
    </article>
  )
}

export function AgriculturalOpportunityExplorer({
  crop,
  season,
  year,
  selectedDistrict,
  onOpenDistrictProfile,
  onOpenEvidence,
}: AgriculturalOpportunityExplorerProps) {
  const results = getAgriculturalOpportunities(evidenceRecords, {
    crop,
    season,
    year,
    district: selectedDistrict,
  })
  const belowReference = results.comparisons.filter(
    (comparison) => comparison.difference < 0,
  )
  const atOrAboveReference = results.comparisons.filter(
    (comparison) => comparison.difference >= 0,
  )
  const incompleteRecords = [...results.unavailable, ...results.insufficient]

  return (
    <section
      aria-labelledby="agricultural-opportunity-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
    >
      <header className="space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            className="text-base font-bold tracking-tight text-forest-950 sm:text-lg"
            id="agricultural-opportunity-heading"
          >
            Agricultural Opportunity Explorer
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Average yield · {crop.replace(/\b\w/g, (letter) => letter.toUpperCase())}
            {' · '}Season {season} · {year.replace('-', '/')}
          </p>
        </div>
        <p className="max-w-4xl text-xs leading-5 text-slate-600">
          Compare observed district yields with the matching national yield.
          Differences are calculated as district minus national; a lower value
          is a discovery signal for further investigation, not a causal finding
          or intervention recommendation.
        </p>
        <p className="text-xs font-medium text-slate-600" role="status">
          {selectedDistrict
            ? `Showing ${selectedDistrict} only. Clear the district selection to compare all districts.`
            : `${results.comparisons.length} comparable ${
                results.comparisons.length === 1 ? 'district' : 'districts'
              } from ${results.matchingDistrictRecordCount} matching district records.`}
        </p>
      </header>

      {results.matchingDistrictRecordCount === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-warm-50 p-4 text-sm leading-6 text-slate-600">
          No connected district yield records match these filters. No values
          have been estimated or substituted.
        </p>
      ) : (
        <>
          {results.comparisons.length === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              No matching district observations have a compatible observed
              national reference. See the separate evidence status below.
            </p>
          )}

          {belowReference.length > 0 && (
            <section aria-labelledby="opportunity-below-heading" className="space-y-2">
              <h3
                className="text-sm font-bold text-amber-800"
                id="opportunity-below-heading"
              >
                Below national reference
                <span className="ml-2 text-xs font-medium text-slate-500">
                  ({belowReference.length})
                </span>
              </h3>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {belowReference.map((comparison) => (
                  <ComparisonCard
                    comparison={comparison}
                    key={comparison.districtRecord.id}
                    onOpenDistrictProfile={onOpenDistrictProfile}
                    onOpenEvidence={onOpenEvidence}
                  />
                ))}
              </div>
            </section>
          )}

          {atOrAboveReference.length > 0 && (
            <section
              aria-labelledby="opportunity-at-or-above-heading"
              className="space-y-2"
            >
              <h3
                className="text-sm font-bold text-forest-900"
                id="opportunity-at-or-above-heading"
              >
                At or above national reference
                <span className="ml-2 text-xs font-medium text-slate-500">
                  ({atOrAboveReference.length})
                </span>
              </h3>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {atOrAboveReference.map((comparison) => (
                  <ComparisonCard
                    comparison={comparison}
                    key={comparison.districtRecord.id}
                    onOpenDistrictProfile={onOpenDistrictProfile}
                    onOpenEvidence={onOpenEvidence}
                  />
                ))}
              </div>
            </section>
          )}

          {incompleteRecords.length > 0 && (
            <details className="rounded-xl border border-slate-200 bg-warm-50 px-4 py-2">
              <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-forest-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2">
                Unavailable or insufficient comparison evidence (
                {incompleteRecords.length})
              </summary>
              <ul className="grid min-w-0 gap-2 border-t border-slate-200 py-3 sm:grid-cols-2">
                {results.unavailable.map((record) => (
                  <li
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5"
                    key={record.id}
                  >
                    <p className="font-semibold text-slate-800">
                      {record.geography.name} · Unavailable
                    </p>
                    <p className="text-slate-600">
                      The connected source marks this district observation
                      unavailable. No value is substituted.
                    </p>
                    <p className="mt-1 break-words text-slate-500">
                      {record.dataset} · {formatSourceReference(record)}
                    </p>
                  </li>
                ))}
                {results.insufficient.map((record) => (
                  <li
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5"
                    key={record.id}
                  >
                    <p className="font-semibold text-slate-800">
                      {record.geography.name} · Insufficient comparison evidence
                    </p>
                    <p className="text-slate-600">
                      {record.value !== null &&
                      Number.isFinite(record.value) ? (
                        <>
                          Observed district yield:{' '}
                          {formatYield(record.value, record.unit)}. No
                          compatible observed national reference was found for
                          the matching source dimensions.
                        </>
                      ) : (
                        'A valid observed district yield is not available for comparison.'
                      )}
                    </p>
                    <p className="mt-1 break-words text-slate-500">
                      {record.dataset} · {formatSourceReference(record)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  )
}
