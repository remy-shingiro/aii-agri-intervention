import { LocateFixed, Minus, Plus } from 'lucide-react'

interface RwandaMapControlsProps {
  onResetView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export function RwandaMapControls({
  onResetView,
  onZoomIn,
  onZoomOut,
}: RwandaMapControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        aria-label="Zoom in"
        className="flex size-10 items-center justify-center text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        onClick={onZoomIn}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>

      <div className="border-t border-slate-200" />

      <button
        aria-label="Zoom out"
        className="flex size-10 items-center justify-center text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        onClick={onZoomOut}
        type="button"
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>

      <div className="border-t border-slate-200" />

      <button
        aria-label="Reset map view"
        className="flex size-10 items-center justify-center text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        onClick={onResetView}
        type="button"
      >
        <LocateFixed aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
