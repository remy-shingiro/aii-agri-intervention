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

  const level = getInterventionSignalLevel(yieldGapPct)

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

/** Shared yield-gap boundaries for intervention signals and map colors. */
export function getInterventionSignalLevel(
  yieldGapPct: number,
): InterventionSignal['level'] {
  if (yieldGapPct <= -20) {
    return 'attention'
  }

  if (yieldGapPct <= -10) {
    return 'moderate'
  }

  return 'near-reference'
}
