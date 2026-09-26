import { ArrowLeft, MapPin } from 'lucide-react'

import { getDistrictInsight } from '../../overview/data/districtInsights'

const DEFAULT_DISTRICT = 'Gatsibo'

export function DistrictProfilePage() {
  const insight = getDistrictInsight(DEFAULT_DISTRICT)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <button
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition-colors hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            type="button"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
            />

            <span>Overview</span>
          </button>

          <span
            aria-hidden="true"
            className="text-slate-300"
          >
            /
          </span>

          <span className="font-medium text-slate-700">
            District Profile
          </span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
              District profile
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {insight.district}
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                <MapPin
                  aria-hidden="true"
                  className="size-3.5"
                />

                Eastern Province
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {insight.crop} · {insight.season} · {insight.year}
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              District-level agricultural productivity and evidence
              to support further investigation and agricultural
              planning.
            </p>
          </div>

          <button
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            type="button"
          >
            Change district
          </button>
        </div>
      </section>

      {/* Intervention signal */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Intervention Signal
              </h2>

              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                {insight.interventionSignal.level === 'attention'
                  ? 'Attention'
                  : insight.interventionSignal.level === 'moderate'
                    ? 'Moderate'
                    : 'Near reference'}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              The signal compares district maize yield with the
              national reference and identifies areas that warrant
              further investigation.
            </p>
          </div>

          <div className="flex items-end gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Yield gap
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {insight.interventionSignal.yieldGapPct > 0
                  ? '+'
                  : ''}
                {insight.interventionSignal.yieldGapPct.toFixed(1)}
                %
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Evidence confidence
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                Moderate
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              District yield
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {insight.averageYield}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              National reference
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {(insight.interventionSignal.referenceYield / 1000).toFixed(
                2,
              )}{' '}
              t/ha
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm leading-6 text-slate-600">
            {insight.insight}
          </p>
        </div>
      </section>

      {/* Productivity overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Productivity Overview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Key agricultural productivity indicators for the selected
            district and period.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              District Yield
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {insight.averageYield}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              National Reference
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {(insight.interventionSignal.referenceYield / 1000).toFixed(
                2,
              )}{' '}
              t/ha
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Yield Gap
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {insight.interventionSignal.yieldGapPct.toFixed(1)}%
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Cultivated Area
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {insight.cultivatedArea}
            </p>
          </article>
        </div>
      </section>

      {/* Coming analytical sections */}
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Yield Trend
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Historical district performance and comparison with the
            national reference will appear here once the historical
            observations are connected.
          </p>
        </article>

        <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Evidence Behind the Signal
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Input use, irrigation, extension, soil and other available
            indicators will be connected here as verified NISR
            evidence becomes available.
          </p>
        </article>
      </section>
    </div>
  )
}
