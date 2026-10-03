import { describe, expect, it } from 'vitest'

import type { AgriculturalObservation } from '../../../types/data-contract'
import {
  getAgriculturalObservations,
  getAgriculturalObservationsByDistrict,
  getAgriculturalObservationsByPeriod,
} from './agriculturalData'
import { maizeObservations } from './maizeObservations'
import { adaptMockMaizeObservations } from './mockAgriculturalObservationAdapter'

describe('agricultural data boundary', () => {
  it('returns observations with the typed domain fields and mock provenance', () => {
    const observations: readonly AgriculturalObservation[] =
      getAgriculturalObservations()
    const firstObservation = observations[0]

    expect(firstObservation).toMatchObject({
      district: 'Nyarugenge',
      crop: 'Maize',
      season: 'A',
      agriculturalYear: '2024/25',
      productionTonnes: 909,
      cultivatedAreaHectares: 679,
      yieldKilogramsPerHectare: 1338,
      source: {
        kind: 'mock',
        dataset: 'Mock maize development data',
      },
    })
  })

  it('filters districts without case sensitivity', () => {
    expect(getAgriculturalObservationsByDistrict('gAsAbO')).toHaveLength(1)
    expect(getAgriculturalObservationsByDistrict('gAsAbO')[0]?.district).toBe(
      'Gasabo',
    )
  })

  it('filters by season and agricultural year', () => {
    const observations = getAgriculturalObservationsByPeriod({
      season: 'A',
      agriculturalYear: '2024/25',
    })

    expect(observations).toHaveLength(maizeObservations.length)
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
