import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardList,
  Database,
  Printer,
  MapPin,
  MessageCircleQuestion,
  Sprout,
} from 'lucide-react'
import { useMemo } from 'react'

import type { AgriculturalSeason } from '../../../types/data-contract'
import type { AgriculturalSignal } from '../../../types/agricultural-signal'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { EvidenceStatusBadge } from '../../evidence/components/EvidenceStatusBadge'
import { EvidenceIndicatorIcon } from '../../evidence/components/EvidenceIndicatorIcon'
import { DistrictComparisonBar } from '../../district-profile/components/DistrictComparisonBar'
import { buildDistrictInvestigationBrief } from '../data/districtInvestigationBrief'

interface InvestigationBriefPageProps {
  readonly district?: string
  readonly crop: string
  readonly year: string
  readonly season: AgriculturalSeason
  readonly onOpenEvidence: (signal: AgriculturalSignal) => void
  readonly onNavigateOverview: () => void
  readonly onNavigateDistrictProfile: () => void
}

function signalStatus(signal: AgriculturalSignal): string {
  switch (signal.signalType) {
    case 'productivity_gap':
      return {
        below_reference: 'Below national reference',
        at_reference: 'At national reference',
        above_reference: 'Above national reference',
        insufficient_evidence: 'Insufficient evidence',
      }[signal.status]
    case 'productivity_trend':
      return {
        improving: 'Higher at latest endpoint',
        declining: 'Lower at latest endpoint',
        relatively_stable: 'Unchanged between endpoints',
        insufficient_evidence: 'Insufficient comparable periods',
      }[signal.status]
    case 'irrigation_investigation':
      return {
        supported: 'Investigation conditions met',
        conditions_not_met: 'Conditions not met',
        insufficient_evidence: 'Insufficient evidence',
      }[signal.status]
  }
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return 'Unavailable'
  return `${value.toLocaleString('en-RW', { maximumFractionDigits: 1 })} ${unit}`
}

function EvidenceRecordDetails({
  record,
}: {
  readonly record: EvidenceRecord
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <EvidenceIndicatorIcon
              className="size-4 shrink-0 text-agri-700"
              indicator={record.indicator}
            />
            {record.label}
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {record.geography.name} ({record.geography.level})
            {record.crop ? ` · ${record.crop}` : ' · all crop activity'}
            {record.period.season
              ? ` · Season ${record.period.season}`
              : record.period.label
                ? ` · ${record.period.label}`
                : ''}
            {' · '}
            {record.period.year}
          </p>
        </div>
        <EvidenceStatusBadge status={record.status} />
      </div>
      <dl className="mt-3 grid gap-3 border-y border-slate-100 py-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Value</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatValue(record.value, record.unit)}
          </dd>
        </div>
        {record.referenceValue !== undefined && (
          <div>
            <dt className="text-xs text-slate-500">
              {record.referenceLabel ?? 'Matched reference'}
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
              {formatValue(record.referenceValue, record.unit)}
            </dd>
          </div>
        )}
        {record.difference !== undefined && record.differenceUnit && (
          <div>
            <dt className="text-xs text-slate-500">Derived difference</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
              {formatValue(record.difference, record.differenceUnit)}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-slate-500">Dataset</dt>
          <dd className="mt-1 text-sm text-slate-800">
            {record.dataset} · {record.source.report}
          </dd>
        </div>
      </dl>
      <p className="mt-3 break-all font-mono text-[11px] text-slate-500">
        Record ID: {record.id}
      </p>
      {record.derivedFromEvidenceIds && (
        <p className="mt-1 break-all text-xs leading-5 text-slate-600">
          Derived from: {record.derivedFromEvidenceIds.join(', ')}
        </p>
      )}
      <a
        className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        href={record.source.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        {record.source.report}: {record.sourceReference.table}
        {record.sourceReference.page !== undefined
          ? ` · p. ${record.sourceReference.page}`
          : ''}
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </a>
    </article>
  )
}

export function InvestigationBriefPage({
  district,
  crop,
  year,
  season,
  onOpenEvidence,
  onNavigateOverview,
  onNavigateDistrictProfile,
}: InvestigationBriefPageProps) {
  const brief = useMemo(
    () => buildDistrictInvestigationBrief(district, crop, year, season),
    [district, crop, season, year],
  )

  return (
    <div className="investigation-brief-page space-y-5">
      <header className="printable-brief flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-agri-700">
            Evidence-led investigation support
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight text-forest-950 sm:text-4xl">
            <ClipboardList
              aria-hidden="true"
              className="size-6 shrink-0 text-agri-700 sm:size-7"
            />
            District investigation brief
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            A structured view of connected NISR evidence for the current
            selection. Signals identify questions to investigate; they do not
            establish causes, recommend interventions, or predict outcomes.
          </p>
        </div>
        <button
          className="no-print inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white hover:bg-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
          onClick={() => window.print()}
          type="button"
        >
          <Printer aria-hidden="true" className="size-4" />
          Print or save as PDF
        </button>
      </header>

      {!brief ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <MapPin
              aria-hidden="true"
              className="size-4 shrink-0 text-agri-700"
            />
            Select a district to prepare its brief
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose a district from the Overview map or district search. The
            brief will use the current crop, season, and agricultural year.
          </p>
          <button
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={onNavigateOverview}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Select district in Overview
          </button>
        </section>
      ) : (
        <>
          <section className="printable-brief rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
                  Selected investigation scope
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-forest-950">
                  <MapPin
                    aria-hidden="true"
                    className="size-5 shrink-0 text-agri-700"
                  />
                  {brief.district}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-700">
                  <Sprout
                    aria-hidden="true"
                    className="size-4 shrink-0 text-agri-700"
                  />
                  {brief.crop} · Season {brief.season} · Agricultural year{' '}
                  {brief.year}
                </p>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                  onClick={onNavigateOverview}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" /> Overview
                </button>
                <button
                  className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                  onClick={onNavigateDistrictProfile}
                  type="button"
                >
                  District profile{' '}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {brief.signals.map((signal) => {
                const signalEvidence = brief.records.filter((record) =>
                  signal.evidenceIds.includes(record.id),
                )
                return (
                  <article
                    className="rounded-lg border border-slate-200 p-4"
                    key={signal.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        {signal.signalType === 'productivity_gap' ? (
                          <EvidenceIndicatorIcon
                            className="size-4 shrink-0 text-agri-700"
                            indicator="average_yield"
                          />
                        ) : signal.signalType === 'irrigation_investigation' ? (
                          <EvidenceIndicatorIcon
                            className="size-4 shrink-0 text-agri-700"
                            indicator="irrigation_practice"
                          />
                        ) : (
                          <ChartNoAxesCombined
                            aria-hidden="true"
                            className="size-4 shrink-0 text-agri-700"
                          />
                        )}
                        {signal.title}
                      </h3>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {signal.status === 'insufficient_evidence' && (
                          <CircleHelp
                            aria-hidden="true"
                            className="mr-1 inline size-3.5 align-[-2px] text-slate-500"
                          />
                        )}
                        {signalStatus(signal)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {signal.summary}
                    </p>

                    {signal.signalType === 'productivity_gap' && (
                      <section
                        className="mt-4 rounded-lg border border-slate-200 bg-warm-50 p-3"
                        aria-label="Yield comparison"
                      >
                        <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <EvidenceIndicatorIcon
                            className="size-4 shrink-0 text-agri-700"
                            indicator="average_yield"
                          />
                          Observed yield · {signal.period.year} · Season{' '}
                          {signal.period.season}
                        </h4>
                        <DistrictComparisonBar
                          difference={signal.absoluteGap}
                          differenceUnit={signal.unit ?? 'Kg/Ha'}
                          districtName={district ?? 'Selected district'}
                          districtValue={signal.districtYield}
                          label="Yield"
                          nationalValue={signal.nationalYield}
                          unit={signal.unit ?? 'Kg/Ha'}
                        />
                      </section>
                    )}

                    {signal.signalType === 'irrigation_investigation' && (
                      <section
                        className="mt-4 rounded-lg border border-slate-200 bg-warm-50 p-3"
                        aria-label="Irrigation evidence comparison"
                      >
                        <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <EvidenceIndicatorIcon
                            className="size-4 shrink-0 text-agri-700"
                            indicator="irrigation_practice"
                          />
                          Same-period evidence comparisons
                        </h4>
                        {brief.irrigationTrail.status === 'available' ? (
                          <div className="space-y-4">
                            <DistrictComparisonBar
                              difference={brief.irrigationTrail.yieldDifference}
                              differenceUnit={
                                brief.irrigationTrail.records.districtYield
                                  .differenceUnit ?? 'Kg/Ha'
                              }
                              districtName={district ?? 'Selected district'}
                              districtValue={
                                brief.irrigationTrail.records.districtYield
                                  .value ?? undefined
                              }
                              label="Maize yield"
                              nationalValue={
                                brief.irrigationTrail.records.nationalYield
                                  .value ?? undefined
                              }
                              unit={
                                brief.irrigationTrail.records.districtYield.unit
                              }
                            />
                            <DistrictComparisonBar
                              difference={
                                brief.irrigationTrail.irrigationDifference
                              }
                              differenceUnit="percentage points"
                              districtName={district ?? 'Selected district'}
                              districtValue={
                                brief.irrigationTrail.records.districtIrrigation
                                  .value ?? undefined
                              }
                              label="District-wide irrigation practice"
                              nationalValue={
                                brief.irrigationTrail.records.nationalIrrigation
                                  .value ?? undefined
                              }
                              scaleMaximum={100}
                              unit="%"
                            />
                          </div>
                        ) : (
                          <p
                            className="flex items-start gap-2 text-sm text-slate-600"
                            role="status"
                          >
                            <CircleHelp
                              aria-hidden="true"
                              className="mt-0.5 size-4 shrink-0 text-slate-500"
                            />
                            Comparable observed yield and irrigation values are
                            unavailable. No chart is drawn.
                          </p>
                        )}
                      </section>
                    )}

                    {signal.signalType === 'productivity_gap' &&
                      signal.absoluteGap !== undefined && (
                        <div className="mt-3 rounded-md bg-warm-50 p-3 text-sm leading-6 text-slate-700">
                          <p>
                            Relative difference (derived):{' '}
                            <strong>
                              {signal.relativeGapPct === undefined
                                ? 'Unavailable'
                                : `${signal.relativeGapPct.toFixed(1)}%`}
                            </strong>
                            {signal.districtYield !== undefined &&
                              signal.nationalYield !== undefined && (
                                <span>
                                  {' '}
                                  · (
                                  {signal.districtYield.toLocaleString(
                                    'en-RW',
                                  )}{' '}
                                  −{' '}
                                  {signal.nationalYield.toLocaleString('en-RW')}
                                  ) ÷{' '}
                                  {signal.nationalYield.toLocaleString('en-RW')}{' '}
                                  × 100
                                </span>
                              )}
                          </p>
                        </div>
                      )}

                    {signal.signalType === 'productivity_trend' && (
                      <p className="mt-3 rounded-md bg-warm-50 p-3 text-sm leading-6 text-slate-700">
                        {signal.netChange === undefined
                          ? 'A change is unavailable until at least two comparable observed periods are connected.'
                          : `Earliest-to-latest observed change: ${formatValue(signal.netChange, signal.unit ?? 'Kg/Ha')}. Periods used: ${signal.periodsUsed.join(', ')}. This is a descriptive endpoint comparison, not a statistical significance test.`}
                      </p>
                    )}

                    {signal.signalType === 'irrigation_investigation' && (
                      <div className="mt-3 rounded-md bg-warm-50 p-3 text-sm leading-6 text-slate-700">
                        <p className="mt-1">
                          Irrigation practice is district-wide across crop
                          activity, not maize-specific. This comparison is an
                          investigation screen, not evidence that irrigation
                          caused a yield difference.
                        </p>
                      </div>
                    )}

                    {signal.rationale.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                        {signal.rationale.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    )}
                    {signal.limitations.map((limitation) => (
                      <p
                        className="mt-2 text-xs leading-5 text-slate-500"
                        key={limitation}
                      >
                        {limitation}
                      </p>
                    ))}
                    {signalEvidence.length > 0 ? (
                      <p className="mt-3 break-all text-xs text-slate-500">
                        Supporting record IDs:{' '}
                        {signalEvidence.map((record) => record.id).join(', ')}
                      </p>
                    ) : (
                      <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                        <CircleHelp
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-slate-500"
                        />
                        No connected source records were available for this
                        signal under the current selection.
                      </p>
                    )}
                    <button
                      className="no-print mt-2 inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                      onClick={() => onOpenEvidence(signal)}
                      type="button"
                      disabled={signal.evidenceIds.length === 0}
                    >
                      Open signal records in Evidence Explorer
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="printable-brief rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-forest-950">
              <Database
                aria-hidden="true"
                className="size-4 shrink-0 text-agri-700"
              />
              Evidence records
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Observed and derived records used by the signal checks, plus
              same-scope production and cultivated-area context when uniquely
              matched. Province records are not expanded to districts.
            </p>
            {brief.records.length > 0 ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {brief.records.map((record, index) => (
                  <EvidenceRecordDetails
                    key={`${record.id}:${index}`}
                    record={record}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
                <CircleHelp
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-slate-500"
                />
                No connected record is available for this district and
                selection. The signal sections above retain their
                insufficient-evidence explanations; no value has been
                substituted.
              </p>
            )}
          </section>

          <section className="printable-brief rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-forest-950">
              <MessageCircleQuestion
                aria-hidden="true"
                className="size-4 shrink-0 text-agri-700"
              />
              Questions for follow-up
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These questions reflect the current evidence and its coverage
              limits. They do not assume a local cause or recommend an
              intervention.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {brief.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
