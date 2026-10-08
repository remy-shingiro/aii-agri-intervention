import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import type { AgriculturalObservation } from '../../../types/data-contract'
import { getDistrictInsight } from './districtInsights'
import {
  getAgriculturalObservations,
  getAgriculturalObservationsByDistrict,
  getAgriculturalObservationsByPeriod,
  getNationalMaizeYieldReference,
} from './agriculturalData'
import { maizeObservations } from './maizeObservations'
import { adaptMockMaizeObservations } from './mockAgriculturalObservationAdapter'
import { nisrMaizeSas2025NationalYieldReference } from './nisrMaizeSas2025NationalYieldReference'

describe('agricultural data boundary', () => {
  it('returns the NISR district observations with provenance and verified dimensions', () => {
    const observations: readonly AgriculturalObservation[] =
      getAgriculturalObservations()
    const firstObservation = observations[0]

    expect(observations).toHaveLength(30)
    expect(
      new Set(observations.map((observation) => observation.district)).size,
    ).toBe(30)
    expect(
      observations.every((observation) => observation.source.kind === 'nisr'),
    ).toBe(true)
    expect(
      observations.every(
        (observation) =>
          observation.geographyLevel === 'district' &&
          observation.crop === 'Maize' &&
          observation.season === 'A' &&
          observation.agriculturalYear === '2024/25',
      ),
    ).toBe(true)
    expect(
      observations.every(
        (observation) => !/^(national|ssf|lsf)$/i.test(observation.district),
      ),
    ).toBe(true)
    expect(
      observations.every(
        (observation) =>
          Number.isFinite(observation.productionTonnes) &&
          observation.productionTonnes >= 0 &&
          Number.isFinite(observation.cultivatedAreaHectares) &&
          observation.cultivatedAreaHectares >= 0 &&
          Number.isFinite(observation.yieldKilogramsPerHectare) &&
          observation.yieldKilogramsPerHectare >= 0,
      ),
    ).toBe(true)
    expect(firstObservation).toMatchObject({
      geographyLevel: 'district',
      district: 'Nyarugenge',
      crop: 'Maize',
      season: 'A',
      agriculturalYear: '2024/25',
      productionTonnes: 909,
      cultivatedAreaHectares: 679,
      yieldKilogramsPerHectare: 1338,
      source: {
        kind: 'nisr',
        dataset: 'SAS 2025',
        report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
        reportYear: 2025,
        references: [{ page: 50 }, { page: 56 }, { page: 61 }],
      },
    })
  })

  it('filters districts without case sensitivity', () => {
    const gasaboObservations = getAgriculturalObservationsByDistrict('gAsAbO')

    expect(gasaboObservations).toHaveLength(1)
    expect(gasaboObservations[0]).toMatchObject({
      district: 'Gasabo',
      geographyLevel: 'district',
      source: { kind: 'nisr' },
    })
  })

  it('keeps district insight lookup and calculations on active NISR values', () => {
    const insight = getDistrictInsight('gAsAbO')
    const nationalReference = getNationalMaizeYieldReference()

    expect(insight).toBeDefined()
    if (!insight) return

    expect(insight).toMatchObject({
      district: 'Gasabo',
      season: 'Season A',
      year: '2024/25',
      source: { kind: 'nisr' },
      nationalYieldReference: nationalReference,
      totalProduction: '5,216 tonnes',
      cultivatedArea: '3,298 ha',
      averageYield: '1,582 kg/ha',
      productivityGap: {
        signalType: 'productivity_gap',
        status: 'below_reference',
        districtYield: 1582,
        nationalYield: nationalReference.value,
        absoluteGap: 1582 - nationalReference.value,
      },
    })
    expect(insight.productivityGap.relativeGapPct).toBeCloseTo(
      ((1582 - nationalReference.value) / nationalReference.value) * 100,
    )
  })

  it('provides the national benchmark with verified NISR provenance and dimensions', () => {
    const reference = getNationalMaizeYieldReference()

    expect(reference).toEqual(nisrMaizeSas2025NationalYieldReference)
    expect(reference).toEqual({
      value: 1985,
      unit: 'Kg/Ha',
      crop: 'Maize',
      season: 'A',
      agriculturalYear: '2024/25',
      geographyLevel: 'national',
      source: {
        kind: 'nisr',
        dataset: 'SAS 2025',
        report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
        reportYear: 2025,
        sourceUrl:
          'https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf',
        references: [
          {
            table:
              'Table 19: 2025 Season A_Average yield by crop type and district (Kg/Ha)',
            page: 56,
          },
        ],
      },
    })
  })

  it('keeps national reference values out of calculation and data-boundary source code', () => {
    const calculationAndBoundaryFiles = [
      new URL('./districtInsights.ts', import.meta.url),
      new URL('./agriculturalData.ts', import.meta.url),
      new URL('./maizeObservations.ts', import.meta.url),
      new URL('../../intelligence/agriculturalSignalEngine.ts', import.meta.url),
    ]

    for (const sourceUrl of calculationAndBoundaryFiles) {
      const source = readFileSync(sourceUrl, 'utf8')

      expect(source).not.toMatch(/\b(?:1,985|1985)\b/)
      expect(source).not.toContain('MAIZE_NATIONAL_YIELD_KG_PER_HA')
    }
  })

  it('filters by season and agricultural year', () => {
    const observations = getAgriculturalObservationsByPeriod({
      season: 'A',
      agriculturalYear: '2024/25',
    })

    expect(observations).toHaveLength(30)
    expect(
      getAgriculturalObservationsByPeriod({
        season: 'B',
        agriculturalYear: '2024/25',
      }),
    ).toHaveLength(0)
  })

  it('does not mutate the original mock maize records', () => {
    const originalRecords = maizeObservations.map((observation) => ({
      ...observation,
    }))

    const adaptedObservations = adaptMockMaizeObservations()

    expect(maizeObservations).toEqual(originalRecords)
    expect(adaptedObservations[0]).not.toBe(maizeObservations[0])
  })
})
