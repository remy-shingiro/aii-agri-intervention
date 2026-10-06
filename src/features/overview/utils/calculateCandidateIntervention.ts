import type { CandidateInterventionSignal } from '../types/candidateIntervention.types'

interface CandidateInterventionInput {
  readonly yieldGapPct: number | undefined
  readonly irrigationPracticePct: number | undefined
  readonly nationalIrrigationPracticePct: number
  readonly yieldEvidenceId: string
  readonly irrigationEvidenceId: string
}

/** Screens for an irrigation-access investigation using only same-period district and national comparisons. */
export function calculateCandidateIntervention({
  yieldGapPct,
  irrigationPracticePct,
  nationalIrrigationPracticePct,
  yieldEvidenceId,
  irrigationEvidenceId,
}: CandidateInterventionInput): CandidateInterventionSignal {
  const evidenceIds = [yieldEvidenceId, irrigationEvidenceId]

  if (yieldGapPct === undefined || irrigationPracticePct === undefined) {
    return {
      intervention: 'Irrigation access assessment',
      status: 'insufficient_evidence',
      rationale: [
        'A comparable district yield gap and district irrigation observation are both required for this screening signal.',
      ],
      evidenceIds: evidenceIds.filter(Boolean),
    }
  }

  if (
    yieldGapPct < 0 &&
    irrigationPracticePct < nationalIrrigationPracticePct
  ) {
    return {
      intervention: 'Irrigation access assessment',
      status: 'supported',
      rationale: [
        `District maize yield is ${Math.abs(yieldGapPct).toFixed(1)}% below the national yield reference.`,
        `The district-wide irrigation practice estimate is ${irrigationPracticePct.toFixed(1)}%, below the national ${nationalIrrigationPracticePct.toFixed(1)}% reference.`,
        'This same-period district comparison supports investigating irrigation access; it does not establish cause or expected impact.',
      ],
      evidenceIds,
    }
  }

  return {
    intervention: 'Irrigation access assessment',
    status: 'insufficient_evidence',
    rationale: [
      'The connected yield and irrigation observations do not meet the stated screening condition for an irrigation-access investigation.',
      'This result does not show that irrigation is irrelevant; it means this evidence pair does not support prioritizing it here.',
    ],
    evidenceIds,
  }
}
