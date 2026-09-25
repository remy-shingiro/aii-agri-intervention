export type InterventionSignalLevel =
  | 'attention'
  | 'moderate'
  | 'near-reference'

export interface InterventionSignal {
  level: InterventionSignalLevel
  yield: number
  referenceYield: number
  yieldGapPct: number
  historicalYield?: number
  historicalChangePct?: number
}
