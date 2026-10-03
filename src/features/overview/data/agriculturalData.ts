import type { AgriculturalObservation } from '../../../types/data-contract'
import { mockAgriculturalObservations } from './mockAgriculturalObservationAdapter'

export { MAIZE_NATIONAL_YIELD_KG_PER_HA } from './maizeObservations'

export interface AgriculturalObservationPeriod {
  readonly season: AgriculturalObservation['season']
  readonly agriculturalYear: string
}

export function getAgriculturalObservations(): readonly AgriculturalObservation[] {
  return mockAgriculturalObservations
}

export function getAgriculturalObservationsByDistrict(
  districtName: string,
): readonly AgriculturalObservation[] {
  const normalizedDistrictName = districtName.trim().toLowerCase()

  return mockAgriculturalObservations.filter(
    (observation) =>
      observation.district.toLowerCase() === normalizedDistrictName,
  )
}

export function getAgriculturalObservationsByPeriod(
  period: AgriculturalObservationPeriod,
): readonly AgriculturalObservation[] {
  return mockAgriculturalObservations.filter(
    (observation) =>
      observation.season === period.season &&
      observation.agriculturalYear === period.agriculturalYear,
  )
}
