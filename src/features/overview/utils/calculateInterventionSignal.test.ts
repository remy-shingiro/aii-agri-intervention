import { describe, expect, it } from 'vitest'

import {
  calculateInterventionSignal,
  getInterventionSignalLevel,
} from './calculateInterventionSignal'

describe('yield-gap intervention thresholds', () => {
  it('assigns an exact -20% gap to the highest-attention category', () => {
    const signal = calculateInterventionSignal({
      yield: 800,
      referenceYield: 1000,
    })

    expect(signal.yieldGapPct).toBe(-20)
    expect(signal.level).toBe('attention')
    expect(getInterventionSignalLevel(signal.yieldGapPct)).toBe('attention')
  })

  it('assigns an exact -10% gap to moderate attention', () => {
    const signal = calculateInterventionSignal({
      yield: 900,
      referenceYield: 1000,
    })

    expect(signal.yieldGapPct).toBe(-10)
    expect(signal.level).toBe('moderate')
    expect(getInterventionSignalLevel(signal.yieldGapPct)).toBe('moderate')
  })

  it('keeps a positive yield gap in the near-reference category', () => {
    const signal = calculateInterventionSignal({
      yield: 1100,
      referenceYield: 1000,
    })

    expect(signal.yieldGapPct).toBe(10)
    expect(signal.level).toBe('near-reference')
    expect(getInterventionSignalLevel(signal.yieldGapPct)).toBe(
      'near-reference',
    )
  })
})
