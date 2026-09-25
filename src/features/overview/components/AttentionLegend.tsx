export function AttentionLegend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
      <div className="mb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Yield gap
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: '#ef6a4a' }}
          />

          <span className="text-xs font-medium text-slate-700">
            ≤ −20%
          </span>

          <span className="hidden text-xs text-slate-400 sm:inline">
            Significant gap
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: '#f3a35c' }}
          />

          <span className="text-xs font-medium text-slate-700">
            −20% to −10%
          </span>

          <span className="hidden text-xs text-slate-400 sm:inline">
            Moderate gap
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: '#63b36b' }}
          />

          <span className="text-xs font-medium text-slate-700">
            &gt; −10%
          </span>

          <span className="hidden text-xs text-slate-400 sm:inline">
            Near reference
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-sm border border-slate-300 bg-[#dbe5df]"
          />

          <span className="text-xs font-medium text-slate-700">
            No data
          </span>
        </div>
      </div>
    </div>
  )
}
