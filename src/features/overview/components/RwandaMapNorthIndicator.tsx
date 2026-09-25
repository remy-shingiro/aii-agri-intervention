import { Compass } from 'lucide-react'

export function RwandaMapNorthIndicator() {
  return (
    <div className="absolute bottom-4 right-4 z-10 hidden sm:block">
      <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass
            aria-hidden="true"
            className="size-5 text-slate-700"
          />

          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            North
          </span>
        </div>
      </div>
    </div>
  )
}
