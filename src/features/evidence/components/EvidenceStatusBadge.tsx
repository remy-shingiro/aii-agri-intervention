import type { EvidenceStatus } from '../types/evidence.types'

interface EvidenceStatusBadgeProps {
  status: EvidenceStatus
}

const statusClasses: Record<EvidenceStatus, string> = {
  observed: 'bg-green-50 text-green-800 ring-green-200',
  derived: 'bg-blue-50 text-blue-800 ring-blue-200',
  unavailable: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const statusLabels: Record<EvidenceStatus, string> = {
  observed: 'Observed',
  derived: 'Derived',
  unavailable: 'Unavailable',
}

export function EvidenceStatusBadge({ status }: EvidenceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}
