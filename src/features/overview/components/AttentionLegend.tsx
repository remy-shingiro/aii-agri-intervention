interface AttentionLegendProps {
  hasObservations: boolean
}

const legendItems = [
  { color: '#e7c49d', label: 'Below national reference' },
  { color: '#dbe5df', label: 'At national reference' },
  { color: '#a9cbb6', label: 'Above national reference' },
  { color: '#f1f5f9', label: 'Insufficient comparison evidence' },
]

export function AttentionLegend({ hasObservations }: AttentionLegendProps) {
  return (
    <div className="max-w-[235px] rounded-lg border border-slate-200 bg-white/95 px-3 py-3 shadow-sm sm:px-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        District yield compared with national
      </p>

      {hasObservations ? (
        <ul aria-label="Productivity comparison categories" className="space-y-1.5">
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
              <span className="text-xs text-slate-600">{item.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm border border-slate-300 bg-white"
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
