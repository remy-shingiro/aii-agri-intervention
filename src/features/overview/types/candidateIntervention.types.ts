export type CandidateInterventionStatus = 'supported' | 'insufficient_evidence'

/** A transparent screening signal for further investigation, not an instruction to invest. */
export interface CandidateInterventionSignal {
  readonly intervention: string
  readonly status: CandidateInterventionStatus
  readonly rationale: readonly string[]
  readonly evidenceIds: readonly string[]
}
