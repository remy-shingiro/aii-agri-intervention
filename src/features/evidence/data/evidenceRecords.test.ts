import { describe, expect, it } from 'vitest'

import { evidenceRecords } from './evidenceRecords'

describe('connected evidence records', () => {
  it('keeps district yield observations and derived comparisons distinct', () => {
    const yieldRecord = evidenceRecords.find(
      (record) =>
        record.geography.name === 'Gasabo' &&
        record.dataset === 'SAS 2025' &&
        record.indicator === 'average_yield',
    )
    const yieldGapRecord = evidenceRecords.find(
      (record) =>
        record.geography.name === 'Gasabo' &&
        record.dataset === 'SAS 2025' &&
        record.indicator === 'yield_gap',
    )

    expect(yieldRecord).toMatchObject({
      value: 1582,
      unit: 'Kg/Ha',
      referenceValue: 1985,
      difference: -403,
      status: 'observed',
      comparisonStatus: 'derived',
      referenceEvidenceId: 'sas-2025-season-a-rwanda-average_yield',
      sourceReference: { page: 56 },
    })
    expect(yieldGapRecord).toMatchObject({
      status: 'derived',
      unit: '%',
      value: expect.closeTo(((1582 - 1985) / 1985) * 100, 6),
      derivedFromEvidenceIds: [
        'sas-2025-season-a-gasabo-average_yield',
        'sas-2025-season-a-rwanda-average_yield',
      ],
    })
  })

  it('keeps all 30 SAS district irrigation values at district geography', () => {
    const irrigationRecords = evidenceRecords.filter(
      (record) =>
        record.indicator === 'irrigation_practice' &&
        record.geography.level === 'district' &&
        record.dataset === 'SAS 2025' &&
        record.period.year === '2024/25' &&
        record.period.season === 'A',
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

  it('records the national yield and irrigation references as observed evidence', () => {
    expect(
      evidenceRecords.find(
        (record) =>
          record.geography.level === 'national' &&
          record.indicator === 'average_yield' &&
          record.dataset === 'SAS 2025' &&
          record.crop === 'Maize',
      ),
    ).toMatchObject({
      geography: { level: 'national', name: 'Rwanda' },
      period: { year: '2024/25', season: 'A' },
      value: 1985,
      status: 'observed',
      sourceReference: { table: expect.stringContaining('Table 19') },
    })

    expect(
      evidenceRecords.find(
        (record) =>
          record.geography.level === 'national' &&
          record.indicator === 'irrigation_practice' &&
          record.dataset === 'SAS 2025',
      ),
    ).toMatchObject({
      geography: { level: 'national', name: 'Rwanda' },
      period: { year: '2024/25', season: 'A' },
      value: 13.4,
      status: 'observed',
      sourceReference: { table: expect.stringContaining('Table 64') },
    })
  })
})
