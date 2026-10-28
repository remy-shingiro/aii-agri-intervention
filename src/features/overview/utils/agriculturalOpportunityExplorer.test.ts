import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import { normalizedEvidenceRecords } from '../../evidence/data/agriculturalEvidence'
import { getAgriculturalOpportunities } from './agriculturalOpportunityExplorer'

const defaultFilters = {
  crop: 'maize',
  season: 'A' as const,
  year: '2024-25',
}

describe('agricultural opportunity explorer', () => {
  it('compares observed district yields with matching observed national references', () => {
    const result = getAgriculturalOpportunities(evidenceRecords, defaultFilters)

    expect(result.comparisons).toHaveLength(30)
    expect(result.comparisons.every(({ districtRecord, nationalRecord }) =>
      districtRecord.status === 'observed' &&
      nationalRecord.status === 'observed' &&
      districtRecord.dataset === nationalRecord.dataset &&
      districtRecord.crop === nationalRecord.crop &&
      districtRecord.period.year === nationalRecord.period.year &&
      districtRecord.period.season === nationalRecord.period.season &&
      districtRecord.unit === nationalRecord.unit,
    )).toBe(true)
    expect(result.comparisons.every(({ districtRecord, nationalRecord, difference }) =>
      difference === districtRecord.value! - nationalRecord.value!,
    )).toBe(true)
  })

  it('honors crop, period, and selected-district filters', () => {
    const result = getAgriculturalOpportunities(evidenceRecords, {
      ...defaultFilters,
      crop: 'sorghum',
      district: 'Kayonza',
    })

    expect(result.matchingDistrictRecordCount).toBe(1)
    expect([
      ...result.comparisons.map(({ districtRecord }) => districtRecord),
      ...result.unavailable,
      ...result.insufficient,
    ].every((record) =>
      record.crop?.toLowerCase() === 'sorghum' &&
      record.geography.name === 'Kayonza' &&
      record.period.year === '2024/25',
    )).toBe(true)
  })

  it('keeps unavailable district observations separate from comparisons', () => {
    const unavailable = normalizedEvidenceRecords.find(
      (record) =>
        record.indicator === 'average_yield' &&
        record.geography.level === 'district' &&
        record.status === 'unavailable' &&
        record.period.season !== undefined &&
        record.crop,
    )
    expect(unavailable).toBeDefined()
    if (!unavailable?.crop || !unavailable.period.season) return

    const result = getAgriculturalOpportunities(normalizedEvidenceRecords, {
      crop: unavailable.crop,
      season: unavailable.period.season,
      year: unavailable.period.year,
      district: unavailable.geography.name,
    })

    expect(result.unavailable).toContainEqual(unavailable)
    expect(result.comparisons).toHaveLength(0)
  })

  it.each([
    ['unit', (record: (typeof evidenceRecords)[number]) => ({ ...record, unit: 'MT' })],
    [
      'period',
      (record: (typeof evidenceRecords)[number]) => ({
        ...record,
        period: { ...record.period, year: '2023/24' },
      }),
    ],
  ])('keeps national references with an incompatible %s in insufficient evidence', (_dimension, changeNational) => {
    const district = evidenceRecords.find(
      (record) =>
        record.indicator === 'average_yield' &&
        record.geography.level === 'district' &&
        record.status === 'observed' &&
        record.crop === 'Maize' &&
        record.period.year === '2024/25' &&
        record.period.season === 'A',
    )
    expect(district).toBeDefined()
    if (!district) return

    const incompatibleNational = evidenceRecords.find(
      (record) =>
        record.indicator === 'average_yield' &&
        record.geography.level === 'national' &&
        record.dataset === district.dataset &&
        record.crop === district.crop &&
        record.period.year === district.period.year &&
        record.period.season === district.period.season,
    )
    expect(incompatibleNational).toBeDefined()
    if (!incompatibleNational) return

    const records = [
      district,
      changeNational(incompatibleNational),
    ]
    const result = getAgriculturalOpportunities(records, {
      crop: district.crop ?? '',
      season: district.period.season ?? 'A',
      year: district.period.year,
    })

    expect(result.comparisons).toHaveLength(0)
    expect(result.insufficient).toContainEqual(district)
  })

  it('returns an explicit empty result when no connected district records match', () => {
    const result = getAgriculturalOpportunities(evidenceRecords, {
      ...defaultFilters,
      crop: 'unconnected crop',
    })

    expect(result.matchingDistrictRecordCount).toBe(0)
    expect(result.comparisons).toHaveLength(0)
    expect(result.unavailable).toHaveLength(0)
    expect(result.insufficient).toHaveLength(0)
  })
})
