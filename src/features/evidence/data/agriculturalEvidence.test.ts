import { describe, expect, it } from 'vitest'

import { nisrMaizeSas2025Source } from '../../overview/data/nisrMaizeSas2025Source'
import { nisrSeasonA2025DistrictPractices } from '../../overview/data/nisrSeasonA2025DistrictPractices'
import { nisrMaizeSas2025NationalYieldReference } from '../../overview/data/nisrMaizeSas2025NationalYieldReference'
import { evidenceRecords } from './evidenceRecords'
import {
  comparisonFor,
  findExactObservation,
  getAvailableCrops,
  nisrDataInventory,
  normalizedEvidenceRecords,
  validateEvidenceRecords,
} from './agriculturalEvidence'

function findRecord(
  dataset: string,
  indicator: string,
  geography: string,
  season: string | undefined,
  crop?: string,
  category?: string,
) {
  return normalizedEvidenceRecords.find(
    (record) =>
      record.dataset === dataset &&
      record.indicator === indicator &&
      record.geography.name === geography &&
      record.period.season === season &&
      record.crop === crop &&
      record.category === category,
  )
}

describe('normalized NISR agricultural evidence', () => {
  it('connects a real SAS 2025 observation with its source page and table', () => {
    const nyarugengeMaize = findRecord(
      'SAS 2025',
      'average_yield',
      'Nyarugenge',
      'A',
      'Maize',
    )

    expect(nyarugengeMaize).toMatchObject({
      value: 1338,
      unit: 'Kg/Ha',
      status: 'observed',
      sourceReference: { page: 56, table: expect.stringContaining('Table 19') },
    })
  })

  it('keeps a missing source cell unavailable instead of treating it as zero', () => {
    const unavailable = findRecord(
      'SAS 2025',
      'cultivated_area',
      'Nyarugenge',
      'A',
      'Sorghum',
    )

    expect(unavailable).toMatchObject({ value: null, status: 'unavailable' })
    expect(unavailable?.value).not.toBe(0)
  })

  it('keeps SAS, AHS, geography, year, and season dimensions distinct', () => {
    const sas2024 = findRecord(
      'SAS 2024', 'average_yield', 'Nyarugenge', 'A', 'Maize',
    )
    const sas2025 = findRecord(
      'SAS 2025', 'average_yield', 'Nyarugenge', 'A', 'Maize',
    )
    const ahs = normalizedEvidenceRecords.find(
      (record) =>
        record.dataset === 'AHS 2024' &&
        record.indicator === 'irrigation_practice' &&
        record.geography.level === 'national',
    )

    expect(sas2024).toMatchObject({ dataset: 'SAS 2024', period: { year: '2023/24', season: 'A' } })
    expect(sas2025).toMatchObject({ dataset: 'SAS 2025', period: { year: '2024/25', season: 'A' } })
    expect(ahs).toMatchObject({
      dataset: 'AHS 2024',
      geography: { level: 'national', name: 'Rwanda' },
      period: { year: '2023/24' },
    })
    expect(ahs?.period.season).toBeUndefined()
    expect(ahs).toMatchObject({ value: 14.1, unit: '%' })
    expect(
      findRecord('AHS 2024', 'fertilizer_risk_awareness', 'Rwanda', undefined),
    ).toMatchObject({ value: 34.8, sourceReference: { page: 11 } })
    expect(
      findRecord('AHS 2024', 'beekeeping', 'Rwanda', undefined),
    ).toMatchObject({ value: 4.8, status: 'observed' })
    expect(normalizedEvidenceRecords.some((record) => record.geography.level === 'province')).toBe(true)
    expect(nisrDataInventory.some((record) => record.geographyLevel === 'province')).toBe(true)
  })

  it('keeps AHS crop, province, irrigation, and extension evidence at source geography', () => {
    const southIrrigation = findRecord('AHS 2024', 'irrigation_practice', 'South', undefined)
    expect(southIrrigation).toMatchObject({
      value: 19.2,
      unit: '%',
      geography: { level: 'province', name: 'South' },
      period: { year: '2023/24' },
      sourceReference: { page: 28, table: expect.stringContaining('Table 22') },
    })
    expect(southIrrigation?.period.season).toBeUndefined()
    expect(findRecord('AHS 2024', 'improved_seed_use', 'East', undefined, 'Maize')).toMatchObject({
      value: 75.1,
      sourceReference: { page: 27, table: expect.stringContaining('Table 20') },
    })
    expect(findRecord(
      'AHS 2024',
      'irrigation_technique_use',
      'East',
      undefined,
      undefined,
      'Flood irrigation',
    )).toMatchObject({ value: 45.1, geography: { level: 'province' } })
    expect(findRecord(
      'AHS 2024',
      'extension_service_use',
      'South',
      undefined,
      undefined,
      'Post-harvest handling and storage',
    )).toMatchObject({ value: 15.2, sourceReference: { page: 33 } })
    expect(findRecord('AHS 2024', 'improved_seed_use', 'Kigali', undefined, 'Wheat'))
      .toMatchObject({ value: null, status: 'unavailable' })
    expect(normalizedEvidenceRecords.some(
      (record) => record.dataset === 'AHS 2024' && record.geography.level === 'district',
    )).toBe(false)
  })

  it('preserves units and NISR provenance on every observed record', () => {
    expect(findRecord('SAS 2025', 'cultivated_area', 'Nyarugenge', 'A', 'Maize')?.unit).toBe('Ha')
    expect(findRecord('SAS 2025', 'crop_production', 'Nyarugenge', 'A', 'Maize')?.unit).toBe('MT')
    expect(
      normalizedEvidenceRecords
        .filter((record) => record.status === 'observed')
        .every((record) =>
          record.source.kind === 'nisr' &&
          record.source.dataset === record.dataset &&
          record.source.sourceUrl.startsWith('https://') &&
          record.sourceReference.table.length > 0 &&
          record.source.references.some((reference) => reference.table === record.sourceReference.table),
        ),
    ).toBe(true)
    expect(validateEvidenceRecords(normalizedEvidenceRecords)).toEqual([])
  })

  it('matches all existing verified SAS 2025 maize and irrigation records', () => {
    for (const legacy of nisrMaizeSas2025Source.records) {
      expect(findRecord(
        'SAS 2025', 'average_yield', legacy.geographyName, 'A', 'Maize',
      )?.value).toBe(legacy.yield)
      expect(findRecord(
        'SAS 2025', 'cultivated_area', legacy.geographyName, 'A', 'Maize',
      )?.value).toBe(legacy.cultivatedArea)
      expect(findRecord(
        'SAS 2025', 'crop_production', legacy.geographyName, 'A', 'Maize',
      )?.value).toBe(legacy.production)
    }

    expect(findRecord(
      'SAS 2025', 'average_yield', 'Rwanda', 'A', 'Maize',
    )?.value).toBe(nisrMaizeSas2025NationalYieldReference.value)

    for (const legacy of nisrSeasonA2025DistrictPractices.records) {
      expect(findRecord(
        'SAS 2025', 'irrigation_practice', legacy.district, 'A',
      )?.value).toBe(legacy.irrigationPracticePct)
    }
    expect(findRecord(
      'SAS 2025', 'irrigation_practice', 'Rwanda', 'A',
    )?.value).toBe(nisrSeasonA2025DistrictPractices.nationalReference)
  })

  it('detects duplicate observation keys', () => {
    const record = normalizedEvidenceRecords.find(
      (item) => item.id === 'sas-2025-season-a-nyarugenge-average_yield',
    )!
    const errors = validateEvidenceRecords([record, { ...record, id: 'duplicate-id' }])
    expect(errors.some((error) => error.startsWith('Duplicate observation:'))).toBe(true)
  })

  it('derives a comparison only from compatible observations', () => {
    const district = findRecord('SAS 2025', 'average_yield', 'Nyarugenge', 'A', 'Maize')!
    const national = findRecord('SAS 2025', 'average_yield', 'Rwanda', 'A', 'Maize')!
    expect(comparisonFor(district, national)).toMatchObject({
      districtValue: 1338,
      nationalValue: 1985,
      difference: -647,
      unit: 'Kg/Ha',
    })
    expect(comparisonFor(district, {
      ...national,
      period: { ...national.period, season: 'B' },
    })).toBeUndefined()
    expect(comparisonFor(district, { ...national, dataset: 'SAS 2024' })).toBeUndefined()
    expect(comparisonFor(district, { ...national, unit: 'MT' })).toBeUndefined()
    expect(comparisonFor(district, {
      ...national,
      geography: { ...national.geography, level: 'province' },
    })).toBeUndefined()
  })

  it('does not substitute a national observation for a missing district row', () => {
    const national = findRecord('SAS 2025', 'average_yield', 'Rwanda', 'A', 'Maize')!
    expect(findExactObservation([national], {
      dataset: 'SAS 2025',
      indicator: 'average_yield',
      geographyId: 'nyarugenge',
      geographyLevel: 'district',
      crop: 'Maize',
      year: '2024/25',
      season: 'A',
    })).toBeUndefined()
  })

  it('derives crop options from observations available in the requested period', () => {
    expect(getAvailableCrops(normalizedEvidenceRecords, {
      year: '2024/25',
      season: 'A',
    })).toContain('Maize')
    expect(getAvailableCrops(normalizedEvidenceRecords, {
      year: '2023/24',
    })).toHaveLength(8)
  })

  it('preserves the existing SAS 2025 irrigation signal and unavailable case', () => {
    const nyarugengeSignal = evidenceRecords.find(
      (record) =>
        record.id === 'sas-2025-season-a-nyarugenge-irrigation_practice',
    )
    const unavailable2024 = findRecord(
      'SAS 2024',
      'irrigation_practice',
      'Nyarugenge',
      'A',
    )

    expect(nyarugengeSignal).toMatchObject({ value: 8.5, unit: '%' })
    expect(unavailable2024).toMatchObject({ value: 7.1, status: 'observed' })
  })
})
