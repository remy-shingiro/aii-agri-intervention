import { describe, expect, it } from 'vitest'

import { evidenceRecords } from './evidenceRecords'

describe('connected evidence records', () => {
  it('keeps district yield observations and derived comparisons distinct', () => {
    const yieldRecord = evidenceRecords.find(
      (record) =>
        record.geography.name === 'Gasabo' &&
        record.indicator === 'average_yield',
    )
    const yieldGapRecord = evidenceRecords.find(
      (record) =>
        record.geography.name === 'Gasabo' && record.indicator === 'yield_gap',
    )

    expect(yieldRecord).toMatchObject({
      value: 1582,
      unit: 'Kg/Ha',
      referenceValue: 1985,
      difference: -403,
      status: 'observed',
      comparisonStatus: 'derived',
      sourceReference: { page: 56 },
    })
    expect(yieldGapRecord).toMatchObject({
      status: 'derived',
      unit: '%',
      value: expect.closeTo(((1582 - 1985) / 1985) * 100, 6),
    })
  })

  it('keeps all 30 SAS district irrigation values at district geography', () => {
    const irrigationRecords = evidenceRecords.filter(
      (record) => record.indicator === 'irrigation_practice',
    )
    const rubavuRecord = irrigationRecords.find(
      (record) => record.geography.name === 'Rubavu',
    )

    expect(irrigationRecords).toHaveLength(30)
    expect(rubavuRecord).toMatchObject({
      value: 1.1,
      referenceValue: 13.4,
      difference: -12.3,
      differenceUnit: 'percentage points',
      sourceReference: { table: expect.stringContaining('Table 64') },
    })
  })
})
