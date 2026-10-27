import type { EvidenceStatus } from '../types/evidence.types'
import { Calculator, CircleCheck, CircleMinus } from 'lucide-react'

interface EvidenceStatusBadgeProps {
  status: EvidenceStatus
}

const statusClasses: Record<EvidenceStatus, string> = {
  observed: 'bg-sage-100 text-forest-950 ring-green-200',
  derived: 'bg-blue-50 text-blue-800 ring-blue-200',
  unavailable: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const statusLabels: Record<EvidenceStatus, string> = {
  observed: 'Observed',
  derived: 'Derived',
  unavailable: 'Unavailable',
}

const statusIcons = {
  observed: CircleCheck,
  derived: Calculator,
  unavailable: CircleMinus,
} satisfies Record<EvidenceStatus, typeof CircleCheck>

export function EvidenceStatusBadge({ status }: EvidenceStatusBadgeProps) {
  const StatusIcon = statusIcons[status]

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ${statusClasses[status]}`}
    >
      <StatusIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {statusLabels[status]}
    </span>
  )
}
