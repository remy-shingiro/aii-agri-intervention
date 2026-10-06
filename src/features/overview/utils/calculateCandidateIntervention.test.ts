import { describe, expect, it } from 'vitest'

import { calculateCandidateIntervention } from './calculateCandidateIntervention'

describe('irrigation investigation screening', () => {
  const evidenceIds = {
    yieldEvidenceId: 'yield-record',
    irrigationEvidenceId: 'irrigation-record',
  }

  it('supports investigation when yield and irrigation are both below reference', () => {
    const signal = calculateCandidateIntervention({
      yieldGapPct: -32.5,
      irrigationPracticePct: 8.5,
      nationalIrrigationPracticePct: 13.4,
      ...evidenceIds,
    })

    expect(signal.status).toBe('supported')
    expect(signal.evidenceIds).toEqual(['yield-record', 'irrigation-record'])
    expect(signal.rationale).toHaveLength(3)
  })

  it('does not support the candidate when the irrigation comparison is above reference', () => {
    const signal = calculateCandidateIntervention({
      yieldGapPct: -20.3,
      irrigationPracticePct: 28.6,
      nationalIrrigationPracticePct: 13.4,
      ...evidenceIds,
    })

    expect(signal.status).toBe('insufficient_evidence')
  })

  it('returns an explicit insufficient state when an observation is missing', () => {
    const signal = calculateCandidateIntervention({
      yieldGapPct: -20,
      irrigationPracticePct: undefined,
      nationalIrrigationPracticePct: 13.4,
      ...evidenceIds,
    })

    expect(signal.status).toBe('insufficient_evidence')
    expect(signal.rationale[0]).toContain('both required')
  })
})
