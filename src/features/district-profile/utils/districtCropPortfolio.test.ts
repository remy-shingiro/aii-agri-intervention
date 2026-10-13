import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import {
  districtCropPortfolioIndicators,
  getDistrictCropPortfolio,
} from './districtCropPortfolio'

function getCrop(
  crop: string,
  year = '2024/25',
  season = 'A',
  records: readonly EvidenceRecord[] = evidenceRecords,
) {
  return getDistrictCropPortfolio(records, 'Nyarugenge', year, season).find(
    (entry) => entry.crop === crop,
  )
}

function getObservation(
  indicator: (typeof districtCropPortfolioIndicators)[number],
  level: 'district' | 'national',
  crop = 'Maize',
  year = '2024/25',
  season = 'A',
): EvidenceRecord | undefined {
  return evidenceRecords.find(
    (record) =>
      record.dataset === (year === '2023/24' ? 'SAS 2024' : 'SAS 2025') &&
      record.period.year === year &&
      record.period.season === season &&
      record.crop === crop &&
      record.indicator === indicator &&
      record.geography.level === level &&
      (level !== 'district' || record.geography.name === 'Nyarugenge'),
  )
}

describe('district crop portfolio', () => {
  it.each([
    ['SAS 2024', '2023/24', 'A', 23],
    ['SAS 2024', '2023/24', 'B', 23],
    ['SAS 2024', '2023/24', 'C', 9],
    ['SAS 2025', '2024/25', 'A', 23],
    ['SAS 2025', '2024/25', 'B', 23],
    ['SAS 2025', '2024/25', 'C', 9],
  ])(
    'selects only the %s district crop records for Season %s (%s crops)',
    (_dataset, year, season, cropCount) => {
      const portfolio = getDistrictCropPortfolio(
        evidenceRecords,
        'Nyarugenge',
        year,
        season,
      )

      expect(portfolio).toHaveLength(cropCount)
      expect(portfolio.every((entry) => entry.metrics)).toBe(true)
      for (const entry of portfolio) {
        for (const indicator of districtCropPortfolioIndicators) {
          const metric = entry.metrics[indicator]
          expect(
            metric.districtRecords.every(
              (record) =>
                record.dataset === _dataset &&
                record.period.year === year &&
                record.period.season === season &&
                record.crop === entry.crop &&
                record.indicator === indicator &&
                record.geography.name === 'Nyarugenge',
            ),
          ).toBe(true)
        }
      }
    },
  )

  it('matches national references on report, crop, indicator, period, and unit', () => {
    const district = getObservation('cultivated_area', 'district')
    const national = getObservation('cultivated_area', 'national')
    expect(district).toBeDefined()
    expect(national).toBeDefined()
    if (!district || !national) return

    const exact = getCrop('Maize', '2024/25', 'A', [district, national])
    expect(exact?.metrics.cultivated_area.nationalRecord?.id).toBe(national.id)
    expect(exact?.metrics.cultivated_area.difference).toBe(
      district.value !== null && national.value !== null
        ? district.value - national.value
        : undefined,
    )

    const mismatches: readonly [string, (record: EvidenceRecord) => EvidenceRecord][] = [
      [
        'dataset',
        (record) => ({
          ...record,
          dataset: 'SAS 2024',
          source: { ...record.source, dataset: 'SAS 2024' },
        }),
      ],
      [
        'report',
        (record) => ({
          ...record,
          source: { ...record.source, report: 'Different report' },
        }),
      ],
      [
        'year',
        (record) => ({
          ...record,
          period: { ...record.period, year: '2023/24' },
        }),
      ],
      [
        'season',
        (record) => ({
          ...record,
          period: { ...record.period, season: 'B' },
        }),
      ],
      [
        'crop',
        (record) => ({ ...record, crop: 'Beans' }),
      ],
      [
        'source crop label',
        (record) => ({ ...record, sourceCrop: 'Different maize label' }),
      ],
      [
        'indicator',
        (record) => ({ ...record, indicator: 'crop_production' }),
      ],
      ['unit', (record) => ({ ...record, unit: 'MT' })],
      [
        'source table',
        (record) => ({
          ...record,
          sourceReference: { ...record.sourceReference, table: 'Different table' },
        }),
      ],
    ]

    for (const [dimension, alter] of mismatches) {
      const mismatched = getCrop('Maize', '2024/25', 'A', [
        district,
        alter(national),
      ])
      expect(
        mismatched?.metrics.cultivated_area.nationalRecord,
        dimension,
      ).toBeUndefined()
      expect(mismatched?.metrics.cultivated_area.difference, dimension).toBeUndefined()
    }
  })

  it('keeps a same-table reference comparable when its page locator differs', () => {
    const district = getObservation('cultivated_area', 'district')
    const national = getObservation('cultivated_area', 'national')
    expect(district && national).toBeTruthy()
    if (!district || !national) return

    const nationalOnAnotherPage = {
      ...national,
      sourceReference: {
        ...national.sourceReference,
        page: (national.sourceReference.page ?? 0) + 1,
      },
    }
    const area = getCrop('Maize', '2024/25', 'A', [district, nationalOnAnotherPage])
      ?.metrics.cultivated_area

    expect(area?.nationalRecord?.id).toBe(national.id)
    expect(area?.difference).toBe(district.value! - national.value!)
    expect(area?.nationalRecord?.sourceReference.page).toBe(
      (national.sourceReference.page ?? 0) + 1,
    )
  })

  it('derives signed absolute differences separately for area, production, and yield', () => {
    const maize = getCrop('Maize')
    expect(maize?.metrics.cultivated_area.difference).toBe(679 - 244095)
    expect(maize?.metrics.crop_production.difference).toBe(909 - 481246)
    expect(maize?.metrics.average_yield.difference).toBe(1338 - 1985)
    expect(maize?.metrics.average_yield.difference).toBe(-647)
  })

  it('preserves unavailable values and never derives their difference', () => {
    const climbingBean = getCrop('Climbing bean', '2024/25', 'C')
    expect(climbingBean).toBeDefined()
    for (const indicator of districtCropPortfolioIndicators) {
      const metric = climbingBean?.metrics[indicator]
      expect(metric?.districtRecord).toMatchObject({
        status: 'unavailable',
        value: null,
      })
      expect(metric?.difference).toBeUndefined()
      expect(metric?.districtRecord?.value).not.toBe(0)
    }
  })

  it('keeps missing records distinct from explicit unavailable observations', () => {
    const districtArea = getObservation('cultivated_area', 'district')
    const nationalArea = getObservation('cultivated_area', 'national')
    const districtProduction = getObservation('crop_production', 'district')
    const nationalProduction = getObservation('crop_production', 'national')
    expect(districtArea && nationalArea && districtProduction && nationalProduction).toBeTruthy()
    if (!districtArea || !nationalArea || !districtProduction || !nationalProduction) return

    const partial = getCrop('Maize', '2024/25', 'A', [
      districtArea,
      nationalArea,
      nationalProduction,
    ])
    expect(partial?.metrics.cultivated_area.difference).toBeDefined()
    expect(partial?.metrics.crop_production.districtRecords).toEqual([])
    expect(partial?.metrics.crop_production.districtRecord).toBeUndefined()
    expect(partial?.metrics.crop_production.difference).toBeUndefined()
  })

  it('does not create crop records for Season C columns absent from the source', () => {
    for (const year of ['2023/24', '2024/25']) {
      const portfolio = getDistrictCropPortfolio(
        evidenceRecords,
        'Nyarugenge',
        year,
        'C',
      )
      expect(portfolio).toHaveLength(9)
      expect(portfolio.some((entry) => entry.crop === 'Maize')).toBe(false)
      expect(portfolio.some((entry) => entry.crop === 'Wheat')).toBe(false)
    }
  })

  it('keeps overlapping crop categories separate and withholds ambiguous duplicates', () => {
    const portfolio = getDistrictCropPortfolio(
      evidenceRecords,
      'Nyarugenge',
      '2024/25',
      'C',
    )
    expect(portfolio.map((entry) => entry.crop)).toContain('Beans')
    expect(portfolio.map((entry) => entry.crop)).toContain('Bush bean')
    expect(portfolio.some((entry) => entry.crop === 'Total beans')).toBe(false)

    const districtArea = getObservation(
      'cultivated_area',
      'district',
      'Maize',
      '2024/25',
      'A',
    )
    const nationalArea = getObservation(
      'cultivated_area',
      'national',
      'Maize',
      '2024/25',
      'A',
    )
    expect(districtArea && nationalArea).toBeTruthy()
    if (!districtArea || !nationalArea) return

    // This second ID is a synthetic duplicate used only to exercise the
    // fail-closed behavior; it is not presented as an NISR observation.
    const duplicate = { ...districtArea, id: `${districtArea.id}-duplicate` }
    const ambiguous = getCrop('Maize', '2024/25', 'A', [
      districtArea,
      duplicate,
      nationalArea,
    ])?.metrics.cultivated_area
    expect(ambiguous?.districtRecords).toHaveLength(2)
    expect(ambiguous?.districtRecord).toBeUndefined()
    expect(ambiguous?.difference).toBeUndefined()
  })

  it('preserves normalized and original crop labels independently per indicator', () => {
    const beans = getCrop('Beans', '2023/24', 'C')
    expect(beans?.metrics.cultivated_area.districtRecord).toMatchObject({
      crop: 'Beans',
      sourceCrop: 'Bean',
    })
    expect(beans?.metrics.cultivated_area.nationalRecord?.sourceCrop).toBe('Bean')
    expect(beans?.metrics.crop_production.districtRecord).toMatchObject({
      crop: 'Beans',
      sourceCrop: 'Beans',
    })
    expect(beans?.metrics.crop_production.nationalRecord?.sourceCrop).toBe('Beans')
    expect(beans?.metrics.cultivated_area.difference).toBeDefined()
    expect(beans?.metrics.crop_production.difference).toBeDefined()
  })

  it('retains source crop labels, source references, and Evidence Explorer IDs', () => {
    const maize = getCrop('Maize')
    const metric = maize?.metrics.average_yield
    expect(metric?.districtRecord).toMatchObject({
      crop: 'Maize',
      sourceCrop: 'Maize',
      source: {
        report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
        sourceUrl: expect.stringMatching(/^https:\/\//),
      },
      sourceReference: {
        table: expect.stringContaining('Table 19'),
        page: 56,
      },
    })
    expect(metric?.nationalRecord?.id).toContain('rwanda')
    expect(metric?.evidenceIds).toEqual([
      metric?.districtRecord?.id,
      metric?.nationalRecord?.id,
    ])
    expect(maize?.evidenceIds).toContain(metric?.districtRecord?.id)
  })

  it('returns no synthetic crop rows for unsupported periods or seasons', () => {
    expect(getDistrictCropPortfolio(evidenceRecords, 'Nyarugenge', '2022/23', 'A')).toEqual([])
    expect(getDistrictCropPortfolio(evidenceRecords, 'Nyarugenge', '2024/25', 'D')).toEqual([])
  })
})
