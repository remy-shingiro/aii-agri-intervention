import type { InterventionSignal } from '../types/interventionSignal.types'

interface InterventionSignalInput {
  yield: number
  referenceYield: number
  historicalYield?: number
}

export function calculateInterventionSignal({
  yield: districtYield,
  referenceYield,
  historicalYield,
}: InterventionSignalInput): InterventionSignal {
  const yieldGapPct =
    referenceYield > 0
      ? ((districtYield - referenceYield) / referenceYield) * 100
      : 0

  let level: InterventionSignal['level']

  if (yieldGapPct <= -20) {
    level = 'attention'
  } else if (yieldGapPct <= -10) {
    level = 'moderate'
  } else {
    level = 'near-reference'
  }

  const historicalChangePct =
    historicalYield !== undefined && historicalYield > 0
      ? ((districtYield - historicalYield) / historicalYield) * 100
      : undefined

  return {
    level,
    yield: districtYield,
    referenceYield,
    yieldGapPct,
    historicalYield,
    historicalChangePct,
  }
}
