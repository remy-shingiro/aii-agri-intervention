import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import {
  districtSeasonalPracticeIndicators,
  getDistrictSeasonalPracticeProfile,
} from './districtSeasonalPracticeProfile'

function getPractice(
  district: string,
  year: string,
  season: string,
  indicator: (typeof districtSeasonalPracticeIndicators)[number],
  records: readonly EvidenceRecord[] = evidenceRecords,
) {
  return getDistrictSeasonalPracticeProfile(records, district, year, season).find(
    (practice) => practice.indicator === indicator,
  )
}

describe('district seasonal practice profile', () => {
  it.each([
    ['SAS 2024', '2023/24', 'A'],
    ['SAS 2024', '2023/24', 'B'],
    ['SAS 2024', '2023/24', 'C'],
    ['SAS 2025', '2024/25', 'A'],
    ['SAS 2025', '2024/25', 'B'],
    ['SAS 2025', '2024/25', 'C'],
  ])('selects all district-wide practices from %s Season %s', (dataset, year, season) => {
    const profile = getDistrictSeasonalPracticeProfile(
      evidenceRecords,
      'Nyarugenge',
      year,
      season,
    )

    expect(profile).toHaveLength(7)
    for (const practice of profile) {
      expect(practice.districtRecord).toMatchObject({
        dataset,
        geography: { level: 'district', name: 'Nyarugenge' },
        period: { year, season },
        unit: '%',
      })
      expect(practice.nationalRecord).toMatchObject({
        dataset,
        geography: { level: 'national', name: 'Rwanda' },
        period: { year, season },
        unit: '%',
      })
      expect(practice.districtRecord?.crop).toBeUndefined()
      expect(practice.districtRecord?.sourceCrop).toBeUndefined()
      expect(practice.nationalRecord?.crop).toBeUndefined()
      expect(practice.evidenceIds).toEqual([
        practice.districtRecord?.id,
        practice.nationalRecord?.id,
      ])
    }
  })

  it('derives the percentage-point difference from the matched observations', () => {
    const practice = getPractice(
      'Nyarugenge',
      '2023/24',
      'A',
      'improved_seed_use',
    )

    expect(practice?.districtRecord?.value).toBe(37.82)
    expect(practice?.nationalRecord?.value).toBe(39.69)
    expect(practice?.difference).toBeCloseTo(-1.87)
  })

  it.each([
    ['SAS 2024', '2023/24', 'A'],
    ['SAS 2025', '2024/25', 'B'],
    ['SAS 2025', '2024/25', 'C'],
  ])('keeps unavailable mechanical equipment evidence unavailable for %s Season %s', (dataset, year, season) => {
    const practice = getPractice(
      'Nyarugenge',
      year,
      season,
      'mechanical_equipment_use',
    )

    expect(practice?.districtRecord).toMatchObject({ dataset, status: 'unavailable', value: null })
    expect(practice?.difference).toBeUndefined()
    expect(practice?.evidenceIds).toHaveLength(2)
  })

  it.each([
    [
      'dataset',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        dataset: 'SAS 2024',
        source: { ...record.source, dataset: 'SAS 2024' },
      }),
    ],
    [
      'year',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        period: { ...record.period, year: '2023/24' },
      }),
    ],
    [
      'season',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        period: { ...record.period, season: 'B' },
      }),
    ],
    [
      'indicator',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        indicator: 'pesticide_use',
      }),
    ],
    [
      'unit',
      (record: EvidenceRecord): EvidenceRecord => ({ ...record, unit: 'kg' }),
    ],
    [
      'report',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        source: { ...record.source, report: 'Another SAS report' },
      }),
    ],
    [
      'table',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        sourceReference: { ...record.sourceReference, table: 'Another table' },
      }),
    ],
    [
      'page',
      (record: EvidenceRecord): EvidenceRecord => ({
        ...record,
        sourceReference: {
          ...record.sourceReference,
          page: (record.sourceReference.page ?? 0) + 1,
        },
      }),
    ],
    [
      'crop-specific record',
      (record: EvidenceRecord): EvidenceRecord => ({ ...record, crop: 'Maize' }),
    ],
  ])('does not compare a national record with a mismatched %s', (_mismatch, alter) => {
    const district = evidenceRecords.find(
      (record) =>
        record.dataset === 'SAS 2025' &&
        record.indicator === 'improved_seed_use' &&
        record.geography.level === 'district' &&
        record.geography.name === 'Nyarugenge' &&
        record.period.season === 'A',
    )
    const national = evidenceRecords.find(
      (record) =>
        record.dataset === 'SAS 2025' &&
        record.indicator === 'improved_seed_use' &&
        record.geography.level === 'national' &&
        record.period.season === 'A',
    )
    expect(district).toBeDefined()
    expect(national).toBeDefined()
    if (!district || !national) return

    const practice = getPractice(
      'Nyarugenge',
      '2024/25',
      'A',
      'improved_seed_use',
      [district, alter(national)],
    )

    expect(practice?.districtRecord?.id).toBe(district.id)
    expect(practice?.nationalRecord).toBeUndefined()
    expect(practice?.difference).toBeUndefined()
  })

  it('does not use another district as the selected district observation', () => {
    const district = evidenceRecords.find(
      (record) =>
        record.dataset === 'SAS 2025' &&
        record.indicator === 'improved_seed_use' &&
        record.geography.level === 'district' &&
        record.geography.name === 'Nyarugenge' &&
        record.period.season === 'A',
    )
    const national = evidenceRecords.find(
      (record) =>
        record.dataset === 'SAS 2025' &&
        record.indicator === 'improved_seed_use' &&
        record.geography.level === 'national' &&
        record.period.season === 'A',
    )
    expect(district).toBeDefined()
    expect(national).toBeDefined()
    if (!district || !national) return

    const practice = getPractice(
      'Kayonza',
      '2024/25',
      'A',
      'improved_seed_use',
      [district, national],
    )

    expect(practice?.districtRecord).toBeUndefined()
    expect(practice?.difference).toBeUndefined()
  })

  it('retains both source records and their navigable provenance identifiers', () => {
    const practice = getPractice(
      'Nyarugenge',
      '2024/25',
      'A',
      'improved_seed_use',
    )

    expect(practice?.districtRecord).toMatchObject({
      source: {
        report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
        sourceUrl: expect.stringMatching(/^https:\/\//),
      },
      sourceReference: {
        table: expect.stringContaining('Table 33'),
        page: 69,
      },
    })
    expect(practice?.nationalRecord?.id).toContain('rwanda')
    expect(practice?.evidenceIds).toEqual([
      practice?.districtRecord?.id,
      practice?.nationalRecord?.id,
    ])
  })
})
