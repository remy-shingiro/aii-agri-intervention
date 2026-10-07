import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { calculateInterventionSignals } from '../../overview/utils/calculateCandidateIntervention'
import { getIrrigationEvidenceTrail } from './irrigationEvidenceTrail'

const context = {
  district: 'Nyarugenge',
  crop: 'Maize',
  year: '2024/25',
  season: 'A' as const,
}

function getIrrigationSignal(records: readonly EvidenceRecord[]) {
  return calculateInterventionSignals(records, context).find(
    (signal) => signal.intervention === 'irrigation',
  )!
}

function getSupportingRecords(records = evidenceRecords) {
  return [
    records.find(
      (record) =>
        record.indicator === 'average_yield' &&
        record.geography.level === 'district' &&
        record.geography.name === context.district &&
        record.dataset === 'SAS 2025' &&
        record.period.year === context.year &&
        record.period.season === context.season,
    ),
    records.find(
      (record) =>
        record.indicator === 'average_yield' &&
        record.geography.level === 'national' &&
        record.dataset === 'SAS 2025' &&
        record.period.year === context.year &&
        record.period.season === context.season,
    ),
    records.find(
      (record) =>
        record.indicator === 'irrigation_practice' &&
        record.geography.level === 'district' &&
        record.geography.name === context.district &&
        record.dataset === 'SAS 2025' &&
        record.period.year === context.year &&
        record.period.season === context.season,
    ),
    records.find(
      (record) =>
        record.indicator === 'irrigation_practice' &&
        record.geography.level === 'national' &&
        record.dataset === 'SAS 2025' &&
        record.period.year === context.year &&
        record.period.season === context.season,
    ),
  ].filter((record): record is EvidenceRecord => record !== undefined)
}

describe('irrigation signal evidence trail', () => {
  it('resolves all four connected NISR evidence IDs for a supported signal', () => {
    const signal = getIrrigationSignal(evidenceRecords)
    const trail = getIrrigationEvidenceTrail(signal, evidenceRecords)

    expect(signal.status).toBe('supported')
    expect(trail.status).toBe('available')
    if (trail.status !== 'available') return

    expect(trail.evidenceIds).toEqual([
      'sas-2025-season-a-nyarugenge-average_yield',
      'sas-2025-season-a-rwanda-average_yield',
      'sas-2025-season-a-nyarugenge-irrigation_practice',
      'sas-2025-season-a-rwanda-irrigation_practice',
    ])
    expect(trail.evidenceIds).toEqual(signal.evidenceIds)
  })

  it.each([
    ['district maize yield', 0],
    ['national maize yield reference', 1],
    ['district irrigation practice', 2],
    ['national irrigation reference', 3],
  ])('fails closed when %s is missing', (_label, recordIndex) => {
    const missingRecord = getSupportingRecords()[recordIndex]
    expect(missingRecord).toBeDefined()
    if (!missingRecord) return

    const records = evidenceRecords.filter(
      (record) => record.id !== missingRecord.id,
    )
    const signal = getIrrigationSignal(records)
    const trail = getIrrigationEvidenceTrail(signal, records)

    expect(signal.status).toBe('insufficient_evidence')
    expect(signal.evidenceIds).not.toContain(missingRecord.id)
    expect(trail).toEqual({ status: 'insufficient_evidence' })
  })

  it('rejects evidence from a different agricultural year', () => {
    const districtYield = getSupportingRecords()[0]!
    const records = evidenceRecords.map((record) =>
      record.id === districtYield.id
        ? { ...record, period: { ...record.period, year: '2023/24' } }
        : record,
    )
    const signal = getIrrigationSignal(records)

    expect(signal.status).toBe('insufficient_evidence')
    expect(getIrrigationEvidenceTrail(signal, records)).toEqual({
      status: 'insufficient_evidence',
    })
  })

  it('rejects evidence from a different season', () => {
    const districtIrrigation = getSupportingRecords()[2]!
    const records = evidenceRecords.map((record) =>
      record.id === districtIrrigation.id
        ? { ...record, period: { ...record.period, season: 'B' as const } }
        : record,
    )
    const signal = getIrrigationSignal(records)

    expect(signal.status).toBe('insufficient_evidence')
    expect(getIrrigationEvidenceTrail(signal, records)).toEqual({
      status: 'insufficient_evidence',
    })
  })

  it('keeps a null observation unavailable instead of converting it to zero', () => {
    const districtYield = getSupportingRecords()[0]!
    const records = evidenceRecords.map((record) =>
      record.id === districtYield.id ? { ...record, value: null } : record,
    )
    const signal = getIrrigationSignal(records)
    const trail = getIrrigationEvidenceTrail(signal, records)

    expect(signal.status).toBe('insufficient_evidence')
    expect(trail).toEqual({ status: 'insufficient_evidence' })
    expect(trail).not.toHaveProperty('records')
  })

  it('derives differences directly from the same-period NISR observations', () => {
    const signal = getIrrigationSignal(evidenceRecords)
    const trail = getIrrigationEvidenceTrail(signal, evidenceRecords)

    expect(trail.status).toBe('available')
    if (trail.status !== 'available') return

    expect(trail.yieldDifference).toBe(
      trail.records.districtYield.value - trail.records.nationalYield.value,
    )
    expect(trail.yieldDifference).toBe(-647)
    expect(trail.irrigationDifference).toBeCloseTo(-4.9)
    expect(trail.irrigationDifference).toBe(
      trail.records.districtIrrigation.value -
        trail.records.nationalIrrigation.value,
    )
  })

  it('does not mark a complete but unmet comparison as a supported signal', () => {
    const kayonzaContext = { ...context, district: 'Kayonza' }
    const signal = calculateInterventionSignals(
      evidenceRecords,
      kayonzaContext,
    ).find((item) => item.intervention === 'irrigation')!
    const trail = getIrrigationEvidenceTrail(signal, evidenceRecords)

    expect(signal.status).toBe('insufficient_evidence')
    expect(trail.status).toBe('available')
  })
})
