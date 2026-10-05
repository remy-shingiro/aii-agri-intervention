interface AttentionLegendProps {
  hasObservations: boolean
}

const legendItems = [
  { color: '#ef6a4a', range: '≤ −20%', label: 'Attention' },
  { color: '#f3a35c', range: '> −20% to ≤ −10%', label: 'Moderate' },
  { color: '#63b36b', range: '> −10%', label: 'Near reference' },
]

export function AttentionLegend({ hasObservations }: AttentionLegendProps) {
  return (
    <div className="max-w-[235px] rounded-lg border border-slate-200 bg-white/95 px-3 py-3 shadow-sm sm:px-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        Yield gap
      </p>

      {hasObservations ? (
        <ul aria-label="Yield gap categories" className="space-y-1.5">
          {legendItems.map((item) => (
            <li
              className="flex items-center gap-2"
              key={item.label}
            >
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-medium tabular-nums text-slate-800">
                {item.range}
              </span>
              <span className="text-xs text-slate-600">{item.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm border border-slate-300 bg-[#dbe5df]"
            />
            <span className="text-xs text-slate-700">No observation</span>
          </li>
        </ul>
      ) : (
        <p className="text-xs leading-5 text-slate-700">
          No district observations are available for the selected filters.
        </p>
      )}
    </div>
  )
}
