import type { AttentionLevel } from '../types/overview.types'

interface AttentionLegendProps {
  levels?: AttentionLevel[]
}

const legendItems = [
  {
    level: 'high' as const,
    label: 'High',
    className: 'bg-red-500',
  },
  {
    level: 'medium' as const,
    label: 'Medium',
    className: 'bg-amber-400',
  },
  {
    level: 'low' as const,
    label: 'Low',
    className: 'bg-green-500',
  },
]

export function AttentionLegend({
  levels = ['high', 'medium', 'low'],
}: AttentionLegendProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-semibold text-slate-900">
        Attention level
      </p>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
        {legendItems
          .filter(({ level }) => levels.includes(level))
          .map(({ level, label, className }) => (
            <div
              className="flex items-center gap-2"
              key={level}
            >
              <span
                aria-hidden="true"
                className={`size-2.5 rounded-full ${className}`}
              />

              <span className="text-xs text-slate-600">
                {label}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}