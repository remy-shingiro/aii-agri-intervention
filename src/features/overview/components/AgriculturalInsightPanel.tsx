import {
  BarChart3,
  CheckCircle2,
  Database,
  Lightbulb,
  Map,
  Ruler,
} from 'lucide-react'

import { getDistrictInsight } from '../data/districtInsights'

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
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
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

export function AgriculturalInsightPanel({
  selectedDistrict,
}: AgriculturalInsightPanelProps) {
  const insight = getDistrictInsight(selectedDistrict)

  return (
    <aside
      aria-label="Agricultural intelligence"
      className="flex flex-col gap-5"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-green-50">
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
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

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Rwanda at a Glance
          </h3>

          <span className="text-xs text-slate-400">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
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
    </aside>
  )
}