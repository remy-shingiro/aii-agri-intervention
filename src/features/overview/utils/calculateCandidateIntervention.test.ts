import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { calculateInterventionSignals } from './calculateCandidateIntervention'

const context = {
  district: 'Test District',
  crop: 'Maize',
  year: '2024/25',
  season: 'A' as const,
}

const fixtureSource = {
  kind: 'nisr' as const,
  dataset: 'Test fixture only',
  report: 'Test fixture only',
  reportYear: 2025,
  sourceUrl: 'https://example.test/source.pdf',
  references: [{ table: 'Test fixture table' }],
}

function fixtureRecord(
  overrides: Partial<EvidenceRecord> & Pick<EvidenceRecord, 'id' | 'indicator'>,
): EvidenceRecord {
  const isNational = overrides.geography?.level === 'national'

  return {
    label: 'Test fixture observation',
    crop: overrides.indicator === 'average_yield' ? 'Maize' : undefined,
    value: overrides.indicator === 'average_yield' ? 1500 : 10,
    unit: overrides.indicator === 'average_yield' ? 'Kg/Ha' : '%',
    geography: isNational
      ? { level: 'national', id: 'rwanda', name: 'Rwanda' }
      : { level: 'district', id: 'test-district', name: 'Test District' },
    period: { year: '2024/25', season: 'A' },
    dataset: fixtureSource.dataset,
    source: fixtureSource,
    sourceReference: fixtureSource.references[0],
    status: 'observed',
    ...overrides,
  }
}

function createFixtureRecords({
  districtYield = 1500,
  nationalYield = 2000,
  districtIrrigation = 10,
  nationalIrrigation = 20,
}: {
  districtYield?: number
  nationalYield?: number
  districtIrrigation?: number
  nationalIrrigation?: number
} = {}): EvidenceRecord[] {
  return [
    fixtureRecord({
      id: 'fixture-district-yield',
      indicator: 'average_yield',
      value: districtYield,
      referenceValue: nationalYield,
      referenceEvidenceId: 'fixture-national-yield',
    }),
    fixtureRecord({
      id: 'fixture-national-yield',
      indicator: 'average_yield',
      value: nationalYield,
      geography: { level: 'national', id: 'rwanda', name: 'Rwanda' },
    }),
    fixtureRecord({
      id: 'fixture-district-irrigation',
      indicator: 'irrigation_practice',
      value: districtIrrigation,
      referenceValue: nationalIrrigation,
      referenceEvidenceId: 'fixture-national-irrigation',
    }),
    fixtureRecord({
      id: 'fixture-national-irrigation',
      indicator: 'irrigation_practice',
      value: nationalIrrigation,
      geography: { level: 'national', id: 'rwanda', name: 'Rwanda' },
    }),
  ]
}

function getIrrigationSignal(records: readonly EvidenceRecord[]) {
  return calculateInterventionSignals(records, context).find(
    (signal) => signal.intervention === 'irrigation',
  )!
}

describe('evidence-backed intervention screening', () => {
  it('supports irrigation investigation only when both district values are below reference', () => {
    const signal = getIrrigationSignal(createFixtureRecords())

    expect(signal.status).toBe('supported')
    expect(signal.evidenceIds).toEqual([
      'fixture-district-yield',
      'fixture-national-yield',
      'fixture-district-irrigation',
      'fixture-national-irrigation',
    ])
    expect(signal.rationale.join(' ')).toContain(
      'does not establish that lower irrigation caused the yield gap',
    )
  })

  it('does not support irrigation when yield is below reference but irrigation is not', () => {
    const signal = getIrrigationSignal(
      createFixtureRecords({ districtIrrigation: 20 }),
    )

    expect(signal.status).toBe('insufficient_evidence')
    expect(signal.rationale.join(' ')).toContain(
      'irrigation practice is not below',
    )
  })

  it('does not support irrigation when irrigation is below reference but yield is not', () => {
    const signal = getIrrigationSignal(
      createFixtureRecords({ districtYield: 2000 }),
    )

    expect(signal.status).toBe('insufficient_evidence')
    expect(signal.rationale.join(' ')).toContain('yield is not below')
  })

  it('keeps irrigation insufficient when district irrigation evidence is missing', () => {
    const records = createFixtureRecords().filter(
      (record) => record.id !== 'fixture-district-irrigation',
    )
    const signal = getIrrigationSignal(records)

    expect(signal.status).toBe('insufficient_evidence')
    expect(signal.rationale.join(' ')).toContain(
      'district-wide and national irrigation practice records',
    )
  })

  it('rejects a national comparison from a mismatched year', () => {
    const records = createFixtureRecords().map((record) =>
      record.id === 'fixture-national-irrigation'
        ? { ...record, period: { ...record.period, year: '2023/24' } }
        : record,
    )

    expect(getIrrigationSignal(records).status).toBe('insufficient_evidence')
  })

  it('rejects a district comparison from a mismatched season', () => {
    const records = createFixtureRecords().map((record) =>
      record.id === 'fixture-district-irrigation'
        ? { ...record, period: { ...record.period, season: 'B' as const } }
        : record,
    )

    expect(getIrrigationSignal(records).status).toBe('insufficient_evidence')
  })

  it('keeps the derived yield gap traceable to district and national yield records', () => {
    const districtYield = evidenceRecords.find(
      (record) =>
        record.geography.name === 'Kayonza' &&
        record.indicator === 'average_yield',
    )
    const nationalYield = evidenceRecords.find(
      (record) =>
        record.geography.level === 'national' &&
        record.indicator === 'average_yield',
    )
    const yieldGap = evidenceRecords.find(
      (record) =>
        record.geography.name === 'Kayonza' && record.indicator === 'yield_gap',
    )

    expect(yieldGap).toMatchObject({
      status: 'derived',
      derivedFromEvidenceIds: [districtYield?.id, nationalYield?.id],
    })
    expect(districtYield?.value).toBe(1925)
    expect(nationalYield?.value).toBe(1985)
  })

  it('keeps soil, post-harvest, processing, and export areas insufficient without connected evidence', () => {
    const signals = calculateInterventionSignals(
      createFixtureRecords(),
      context,
    )

    expect(
      signals
        .filter((signal) => signal.intervention !== 'irrigation')
        .map((signal) => [signal.intervention, signal.status]),
    ).toEqual([
      ['soil_fertility', 'insufficient_evidence'],
      ['post_harvest', 'insufficient_evidence'],
      ['processing', 'insufficient_evidence'],
      ['export', 'insufficient_evidence'],
    ])
  })
})
