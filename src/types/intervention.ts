export type InterventionStatus = 'supported' | 'insufficient_evidence'

export type InterventionType =
  | 'irrigation'
  | 'soil_fertility'
  | 'post_harvest'
  | 'processing'
  | 'export'

export interface InterventionPeriod {
  readonly crop: string
  readonly year: string
  readonly season: 'A' | 'B' | 'C'
}

/** A traceable evidence screen, not an investment or causal recommendation. */
export interface InterventionSignal {
  readonly intervention: InterventionType
  readonly status: InterventionStatus
  readonly title: string
  readonly rationale: readonly string[]
  readonly evidenceIds: readonly string[]
  readonly period: InterventionPeriod
}
