import type { AgriculturalObservation } from '../../../types/data-contract'
import { adaptNisrAgriculturalObservations } from './nisrAgriculturalObservationAdapter'
import { mockAgriculturalObservations } from './mockAgriculturalObservationAdapter'
import { nisrMaizeSas2025Source } from './nisrMaizeSas2025Source'

const agriculturalObservationsBySource = {
  mock: mockAgriculturalObservations,
  nisr: adaptNisrAgriculturalObservations(nisrMaizeSas2025Source),
} satisfies Record<'mock' | 'nisr', readonly AgriculturalObservation[]>

// Keep the mock active; this is the only source selection point for the layer.
const activeDataSource: keyof typeof agriculturalObservationsBySource = 'mock'
const activeAgriculturalObservations =
  agriculturalObservationsBySource[activeDataSource]

export { MAIZE_NATIONAL_YIELD_KG_PER_HA } from './maizeObservations'

export interface AgriculturalObservationPeriod {
  readonly season: AgriculturalObservation['season']
  readonly agriculturalYear: string
}

export function getAgriculturalObservations(): readonly AgriculturalObservation[] {
  return activeAgriculturalObservations
}

export function getAgriculturalObservationsByDistrict(
  districtName: string,
): readonly AgriculturalObservation[] {
  const normalizedDistrictName = districtName.trim().toLowerCase()

  return activeAgriculturalObservations.filter(
    (observation) =>
      observation.district.toLowerCase() === normalizedDistrictName,
  )
}

export function getAgriculturalObservationsByPeriod(
  period: AgriculturalObservationPeriod,
): readonly AgriculturalObservation[] {
  return activeAgriculturalObservations.filter(
    (observation) =>
      observation.season === period.season &&
      observation.agriculturalYear === period.agriculturalYear,
  )
}
