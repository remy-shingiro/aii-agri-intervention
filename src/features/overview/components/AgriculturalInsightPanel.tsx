import {
  BarChart3,
  CheckCircle2,
  Database,
  Lightbulb,
  Map,
  Ruler,
} from 'lucide-react'

import { getDistrictInsight } from '../data/districtInsights'
import type { InterventionSignalLevel } from '../types/interventionSignal.types'

interface AgriculturalInsightPanelProps {
  selectedDistrict?: string
}

interface KpiCardProps {
  label: string
  value: string
  icon: typeof BarChart3
}

function KpiCard({ label, value, icon: Icon }: KpiCardProps) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
            {label}
          </p>
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
          <Icon
            aria-hidden="true"
            className="size-4 text-green-700"
            strokeWidth={1.8}
          />
        </div>
      </div>
    </article>
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

function getSignalDescription(
  level: InterventionSignalLevel,
): string {
  switch (level) {
    case 'attention':
      return 'Yield is substantially below the national reference and warrants further investigation.'

    case 'moderate':
      return 'Yield is below the national reference and may warrant further investigation.'

    case 'near-reference':
      return 'Yield is close to the national reference for the selected period.'
  }
}

function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : ''

  return `${sign}${value.toFixed(1)}%`
}

export function AgriculturalInsightPanel({
  selectedDistrict,
}: AgriculturalInsightPanelProps) {
  const insight = getDistrictInsight(selectedDistrict)
  const signal = insight.interventionSignal

  return (
    <aside
      aria-label="Agricultural intelligence"
      className="flex min-h-0 flex-col lg:h-full lg:overflow-y-auto lg:pr-1"
    >
      <div className="flex flex-col gap-5">
        {/* Key insight */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <Lightbulb
                aria-hidden="true"
                className="size-4 text-green-700"
                strokeWidth={1.8}
              />
            </div>

            <h3 className="text-sm font-semibold text-slate-900">
              Key Insight
            </h3>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {insight.district}
              </span>

              <span aria-hidden="true">•</span>

              <span>{insight.crop}</span>

              <span aria-hidden="true">•</span>

              <span>{insight.season}</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              {insight.insight}
            </p>

            <button
              className="mt-4 text-sm font-semibold text-green-700 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              type="button"
            >
              {insight.evidenceLabel} →
            </button>
          </div>
        </section>

        {/* Intervention signal */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Intervention Signal
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Based on district yield relative to the national reference.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {getSignalLabel(signal.level)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                District yield
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {insight.averageYield}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Reference yield
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {(signal.referenceYield / 1000).toFixed(2)} t/ha
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">
                Yield gap
              </span>

              <span className="text-sm font-bold text-slate-900">
                {formatPercentage(signal.yieldGapPct)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {getSignalDescription(signal.level)}
          </p>
        </section>

        {/* KPIs */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Rwanda at a Glance
            </h3>

            <span className="shrink-0 text-xs text-slate-400">
              {insight.year}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              icon={BarChart3}
              label="Total Production"
              value={insight.totalProduction}
            />

            <KpiCard
              icon={Map}
              label="Cultivated Area"
              value={insight.cultivatedArea}
            />

            <KpiCard
              icon={Ruler}
              label="Average Yield"
              value={insight.averageYield}
            />

            <KpiCard
              icon={Database}
              label="Input Use"
              value={insight.inputUse}
            />
          </div>
        </section>

        {/* Data source */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <CheckCircle2
                aria-hidden="true"
                className="size-5 text-green-700"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">
                Data source
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-700">
                NISR — Agricultural Survey
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Official agricultural statistics
              </p>

              <p className="mt-2 text-xs font-medium text-green-700">
                {insight.year}
              </p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
