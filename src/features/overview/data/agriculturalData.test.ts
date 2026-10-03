import { describe, expect, it } from 'vitest'

import type { AgriculturalObservation } from '../../../types/data-contract'
import { getDistrictInsight } from './districtInsights'
import {
  getAgriculturalObservations,
  getAgriculturalObservationsByDistrict,
  getAgriculturalObservationsByPeriod,
} from './agriculturalData'
import { maizeObservations } from './maizeObservations'
import { adaptMockMaizeObservations } from './mockAgriculturalObservationAdapter'

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
      observations.every(
        (observation) => observation.source.kind === 'nisr',
      ),
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
        (observation) =>
          !/^(national|ssf|lsf)$/i.test(observation.district),
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

    expect(insight).toMatchObject({
      district: 'Gasabo',
      season: 'Season A',
      year: '2024/25',
      source: { kind: 'nisr' },
      totalProduction: '5,216 tonnes',
      cultivatedArea: '3,298 ha',
      averageYield: '1.58 t/ha',
      interventionSignal: {
        level: 'attention',
        yield: 1582,
        referenceYield: 1985,
      },
    })
    expect(insight.yieldGapPct).toBeCloseTo(((1582 - 1985) / 1985) * 100)
    expect(insight.interventionSignal.yieldGapPct).toBeCloseTo(
      insight.yieldGapPct,
    )
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
