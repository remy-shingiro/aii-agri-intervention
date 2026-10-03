import type { AgriculturalObservation } from '../../../types/data-contract'
import { maizeObservations, type MaizeObservation } from './maizeObservations'

/** Maps the existing development-only maize records into the domain model. */
export function adaptMockMaizeObservations(
  observations: readonly MaizeObservation[] = maizeObservations,
): readonly AgriculturalObservation[] {
  return observations.map((observation) => ({
    geographyLevel: 'district',
    district: observation.district,
    crop: 'Maize',
    season: observation.season,
    agriculturalYear: observation.agriculturalYear,
    productionTonnes: observation.productionTonnes,
    cultivatedAreaHectares: observation.cultivatedAreaHa,
    yieldKilogramsPerHectare: observation.yieldKgPerHa,
    source: {
      kind: 'mock',
      dataset: 'Mock maize development data',
    },
  }))
}

export const mockAgriculturalObservations = adaptMockMaizeObservations()
