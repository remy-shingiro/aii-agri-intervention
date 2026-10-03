import type {
  AgriculturalObservation,
  AgriculturalYieldReference,
} from '../../../types/data-contract'
import { adaptNisrAgriculturalObservations } from './nisrAgriculturalObservationAdapter'
import { mockAgriculturalObservations } from './mockAgriculturalObservationAdapter'
import { nisrMaizeSas2025Source } from './nisrMaizeSas2025Source'
import { nisrMaizeSas2025NationalYieldReference } from './nisrMaizeSas2025NationalYieldReference'

const agriculturalObservationsBySource = {
  mock: mockAgriculturalObservations,
  nisr: adaptNisrAgriculturalObservations(nisrMaizeSas2025Source),
} satisfies Record<'mock' | 'nisr', readonly AgriculturalObservation[]>

// This is the only source selection point for the agricultural data layer.
const activeDataSource: keyof typeof agriculturalObservationsBySource = 'nisr'
const activeAgriculturalObservations =
  agriculturalObservationsBySource[activeDataSource]

export interface AgriculturalObservationPeriod {
  readonly season: AgriculturalObservation['season']
  readonly agriculturalYear: string
}

export function getNationalMaizeYieldReference(): AgriculturalYieldReference {
  return nisrMaizeSas2025NationalYieldReference
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
