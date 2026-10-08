import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../evidence/types/evidence.types'
import type { AgriculturalSeason } from '../../types/data-contract'
import {
  agriculturalSignalRegistry,
  calculateAgriculturalSignals,
  calculateProductivityGap,
} from './agriculturalSignalEngine'

const fixtureContext = {
  district: 'Test District',
  crop: 'Maize',
  year: '2024/25',
  season: 'A' as const,
}

function fixtureSource(dataset: string) {
  return {
    kind: 'nisr' as const,
    dataset,
    report: `${dataset} test fixture only`,
    reportYear: dataset === 'SAS 2024' ? 2024 : 2025,
    sourceUrl: 'https://example.test/test-fixture-only.pdf',
    references: [{ table: 'Test fixture table' }],
  }
}

function fixtureRecord(
  overrides: Partial<EvidenceRecord> & Pick<EvidenceRecord, 'id' | 'indicator'>,
): EvidenceRecord {
  const dataset = overrides.dataset ?? 'SAS 2025'
  const source = overrides.source ?? fixtureSource(dataset)
  const geography = {
    level: 'district' as const,
    id: 'test-district',
    name: 'Test District',
    ...overrides.geography,
  }
  const period = {
    year: '2024/25',
    season: 'A' as AgriculturalSeason,
    ...overrides.period,
  }

  return {
    label: 'Test fixture observation only',
    crop: overrides.indicator === 'irrigation_practice' ? undefined : 'Maize',
    value: overrides.indicator === 'average_yield' ? 1500 : 10,
    unit: overrides.indicator === 'average_yield' ? 'Kg/Ha' : '%',
    geography,
    period,
    dataset,
    source,
    sourceReference: overrides.sourceReference ?? source.references[0],
    status: 'observed',
    ...overrides,
  }
}

function yieldPair({
  districtYield = 1500,
  nationalYield = 2000,
}: {
  districtYield?: number
  nationalYield?: number
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
  ]
}

function irrigationRecords({
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
    ...yieldPair({ districtYield, nationalYield }),
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

function trendRecords(
  yields: readonly number[],
  options: { readonly missingSecond?: boolean } = {},
): EvidenceRecord[] {
  const years = ['2022/23', '2023/24', '2024/25']
  return yields.map((value, index) => {
    const year = years[index]
    const dataset = index === 0 ? 'SAS 2024' : 'SAS 2025'
    return fixtureRecord({
      id: `fixture-yield-${year}`,
      indicator: 'average_yield',
      value: options.missingSecond && index === 1 ? null : value,
      status: options.missingSecond && index === 1 ? 'unavailable' : 'observed',
      dataset,
      source: fixtureSource(dataset),
      period: { year, season: fixtureContext.season },
    })
  })
}

function gap(records: readonly EvidenceRecord[]) {
  return calculateProductivityGap(records, fixtureContext)
}

describe('Agricultural Intelligence signal registry', () => {
  it('registers only the three supported intelligence signals', () => {
    expect(Object.keys(agriculturalSignalRegistry)).toEqual([
      'productivity_gap',
      'productivity_trend',
      'irrigation_investigation',
    ])
  })
})

describe('productivity gap', () => {
  it('calculates a below-reference absolute and relative gap from observed records', () => {
    const signal = gap(yieldPair())

    expect(signal).toMatchObject({
      status: 'below_reference',
      districtYield: 1500,
      nationalYield: 2000,
      absoluteGap: -500,
      relativeGapPct: -25,
      observedEvidenceIds: ['fixture-district-yield', 'fixture-national-yield'],
      derivedEvidenceIds: [],
    })
  })

  it('returns above-reference and at-reference from direct comparisons', () => {
    expect(gap(yieldPair({ districtYield: 2200 })).status).toBe('above_reference')
    expect(gap(yieldPair({ districtYield: 2000 })).status).toBe('at_reference')
  })

  it('returns insufficient evidence when the district observation is unavailable', () => {
    const records = yieldPair().map((record) =>
      record.id === 'fixture-district-yield'
        ? { ...record, value: null, status: 'unavailable' as const }
        : record,
    )
    expect(gap(records).status).toBe('insufficient_evidence')
    expect(gap(records).evidenceIds).toContain('fixture-district-yield')
  })

  it('returns insufficient evidence when the national reference is missing or unavailable', () => {
    expect(
      gap(yieldPair().filter((record) => record.id !== 'fixture-national-yield'))
        .status,
    ).toBe('insufficient_evidence')

    const records = yieldPair().map((record) =>
      record.id === 'fixture-national-yield'
        ? { ...record, value: null, status: 'unavailable' as const }
        : record,
    )
    expect(gap(records).status).toBe('insufficient_evidence')
  })

  it('rejects a mismatched period, crop, or yield unit', () => {
    const base = yieldPair()
    const mismatchedPeriod = base.map((record) =>
      record.id === 'fixture-national-yield'
        ? { ...record, period: { ...record.period, year: '2023/24' } }
        : record,
    )
    const mismatchedCrop = base.map((record) =>
      record.id === 'fixture-national-yield'
        ? { ...record, crop: 'Wheat' }
        : record,
    )
    const invalidUnit = base.map((record) =>
      record.id === 'fixture-district-yield'
        ? { ...record, unit: 'tonnes/ha' }
        : record,
    )

    expect(gap(mismatchedPeriod).status).toBe('insufficient_evidence')
    expect(gap(mismatchedCrop).status).toBe('insufficient_evidence')
    expect(gap(invalidUnit).status).toBe('insufficient_evidence')
  })

  it('requires each observed input to cite its source table and page', () => {
    const invalidProvenance = yieldPair().map((record) =>
      record.id === 'fixture-district-yield'
        ? {
            ...record,
            source: { ...record.source, references: [] },
          }
        : record,
    )

    expect(gap(invalidProvenance).status).toBe('insufficient_evidence')
  })

  it('does not calculate a relative gap when the national reference is zero', () => {
    const signal = gap(yieldPair({ districtYield: 0, nationalYield: 0 }))
    expect(signal.status).toBe('at_reference')
    expect(signal.absoluteGap).toBe(0)
    expect(signal.relativeGapPct).toBeUndefined()
  })

  it('retains a linked derived yield-gap record when the evidence repository provides it', () => {
    const signal = calculateProductivityGap(evidenceRecords, {
      district: 'Nyarugenge',
      crop: 'Maize',
      year: '2024/25',
      season: 'A',
    })

    expect(signal.absoluteGap).toBe(-647)
    expect(signal.derivedEvidenceIds).toEqual([
      'sas-2025-season-a-nyarugenge-average_yield-yield-gap',
    ])
  })

  it('ignores a derived yield-gap row when its value or provenance disagrees with the observed inputs', () => {
    const derivedId =
      'sas-2025-season-a-nyarugenge-average_yield-yield-gap'
    const mismatchedValue = evidenceRecords.map((record) =>
      record.id === derivedId ? { ...record, value: 999 } : record,
    )
    const mismatchedProvenance = evidenceRecords.map((record) =>
      record.id === derivedId
        ? { ...record, sourceReference: { table: 'Unrelated fixture table' } }
        : record,
    )

    for (const records of [mismatchedValue, mismatchedProvenance]) {
      const signal = calculateProductivityGap(records, {
        district: 'Nyarugenge',
        crop: 'Maize',
        year: '2024/25',
        season: 'A',
      })

      expect(signal.status).toBe('below_reference')
      expect(signal.derivedEvidenceIds).toEqual([])
      expect(signal.evidenceIds).toEqual(signal.observedEvidenceIds)
    }
  })
})

describe('productivity direction', () => {
  it('marks increasing endpoint yield as improving', () => {
    const [, signal] = calculateAgriculturalSignals(
      trendRecords([1000, 1300]),
      fixtureContext,
    )
    expect(signal.status).toBe('improving')
    expect(signal.periodsUsed).toEqual(['2022/23', '2023/24'])
    expect(signal.netChange).toBe(300)
  })

  it('marks decreasing endpoint yield as declining', () => {
    const [, signal] = calculateAgriculturalSignals(
      trendRecords([1500, 1200]),
      fixtureContext,
    )
    expect(signal.status).toBe('declining')
    expect(signal.netChange).toBe(-300)
  })

  it('marks exact endpoint equality as relatively stable', () => {
    const [, signal] = calculateAgriculturalSignals(
      trendRecords([1200, 1200]),
      fixtureContext,
    )
    expect(signal.status).toBe('relatively_stable')
    expect(signal.netChange).toBe(0)
  })

  it('requires at least two distinct comparable periods', () => {
    const [, onePeriod] = calculateAgriculturalSignals(
      trendRecords([1200]),
      fixtureContext,
    )
    expect(onePeriod.status).toBe('insufficient_evidence')

    const mismatched = trendRecords([1200, 1400]).map((record) =>
      record.period.year === '2023/24'
        ? { ...record, period: { ...record.period, season: 'B' as const } }
        : record,
    )
    const [, incompatiblePeriod] = calculateAgriculturalSignals(
      mismatched,
      fixtureContext,
    )
    expect(incompatiblePeriod.status).toBe('insufficient_evidence')
  })

  it('fails closed when a matching historical observation is unavailable', () => {
    const [, signal] = calculateAgriculturalSignals(
      trendRecords([1000, 1100], { missingSecond: true }),
      fixtureContext,
    )
    expect(signal.status).toBe('insufficient_evidence')
    expect(signal.rationale.join(' ')).toContain('unavailable or missing yield value')
  })

  it('rejects incompatible units and crop semantics', () => {
    const differentUnit = trendRecords([1000, 1100]).map((record) =>
      record.period.year === '2023/24'
        ? { ...record, unit: 'MT/Ha' }
        : record,
    )
    const differentCrop = trendRecords([1000, 1100]).map((record) =>
      record.period.year === '2023/24'
        ? { ...record, crop: 'Wheat' }
        : record,
    )
    const [, unitSignal] = calculateAgriculturalSignals(differentUnit, fixtureContext)
    const [, cropSignal] = calculateAgriculturalSignals(differentCrop, fixtureContext)
    expect(unitSignal.status).toBe('insufficient_evidence')
    expect(cropSignal.status).toBe('insufficient_evidence')
  })
})

describe('irrigation investigation', () => {
  it('supports the signal when yield and irrigation practice are both below reference', () => {
    const [, , signal] = calculateAgriculturalSignals(
      irrigationRecords(),
      fixtureContext,
    )
    expect(signal.status).toBe('supported')
    expect(signal.evidenceIds).toHaveLength(4)
  })

  it('marks a complete comparison as conditions not met when either condition fails', () => {
    const [, , yieldNotBelow] = calculateAgriculturalSignals(
      irrigationRecords({ districtYield: 2000 }),
      fixtureContext,
    )
    const [, , irrigationNotBelow] = calculateAgriculturalSignals(
      irrigationRecords({ districtIrrigation: 20 }),
      fixtureContext,
    )
    expect(yieldNotBelow.status).toBe('conditions_not_met')
    expect(irrigationNotBelow.status).toBe('conditions_not_met')
  })

  it('returns insufficient evidence when a required record is missing', () => {
    const complete = irrigationRecords()
    for (const missingId of [
      'fixture-district-yield',
      'fixture-national-yield',
      'fixture-district-irrigation',
      'fixture-national-irrigation',
    ]) {
      const [, , signal] = calculateAgriculturalSignals(
        complete.filter((record) => record.id !== missingId),
        fixtureContext,
      )
      expect(signal.status, missingId).toBe('insufficient_evidence')
    }
  })

  it('rejects mismatched periods, district geography, and irrigation units', () => {
    const complete = irrigationRecords()
    const mismatchedPeriod = complete.map((record) =>
      record.id === 'fixture-national-irrigation'
        ? { ...record, period: { ...record.period, year: '2023/24' } }
        : record,
    )
    const mismatchedDistrict = complete.map((record) =>
      record.id === 'fixture-district-irrigation'
        ? { ...record, geography: { ...record.geography, id: 'other-district' } }
        : record,
    )
    const invalidUnit = complete.map((record) =>
      record.indicator === 'irrigation_practice'
        ? { ...record, unit: 'share' }
        : record,
    )
    const mismatchedSourceTable = complete.map((record) =>
      record.id === 'fixture-national-irrigation'
        ? { ...record, sourceReference: { table: 'Incompatible fixture table' } }
        : record,
    )

    for (const records of [
      mismatchedPeriod,
      mismatchedDistrict,
      invalidUnit,
      mismatchedSourceTable,
    ]) {
      const [, , signal] = calculateAgriculturalSignals(records, fixtureContext)
      expect(signal.status).toBe('insufficient_evidence')
    }
  })

  it('retains traceable source IDs for every generated signal', () => {
    const signals = calculateAgriculturalSignals(evidenceRecords, {
      district: 'Nyarugenge',
      crop: 'Maize',
      year: '2024/25',
      season: 'A',
    })
    const recordById = new Map(evidenceRecords.map((record) => [record.id, record]))

    for (const signal of signals) {
      expect(signal.evidenceIds.length).toBeGreaterThan(0)
      expect(signal.sourceRecordIds.every((id) => recordById.has(id))).toBe(true)
      expect(signal.observedEvidenceIds.every(
        (id) => recordById.get(id)?.status === 'observed',
      )).toBe(true)
      expect(signal.derivedEvidenceIds.every(
        (id) => recordById.get(id)?.status === 'derived',
      )).toBe(true)
      expect(signal.evidenceIds.every((id) => recordById.has(id))).toBe(true)
    }
  })
})
