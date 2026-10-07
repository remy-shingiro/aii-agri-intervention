import type {
  AgriculturalDataSourceReference,
  AgriculturalObservationSource,
  AgriculturalSeason,
} from '../../../types/data-contract'

import type { InterventionType } from '../../../types/intervention'

export type EvidenceStatus = 'observed' | 'derived' | 'unavailable'

export type EvidenceIndicator =
  | 'average_yield'
  | 'yield_gap'
  | 'cultivated_area'
  | 'crop_production'
  | 'irrigation_practice'
  | 'improved_seed_use'
  | 'organic_fertilizer_use'
  | 'inorganic_fertilizer_use'
  | 'pesticide_use'
  | 'erosion_control_practice'
  | 'mechanical_equipment_use'
  | 'agroforestry_practice'
  | 'agricultural_association_membership'
  | 'agricultural_extension_use'
  | 'kitchen_garden_use'
  | 'fertilizer_risk_awareness'
  | 'pesticide_risk_awareness'
  | 'livestock_ownership'
  | 'beekeeping'
  | 'inorganic_fertilizer_source_use'
  | 'erosion_control_measure_use'
  | 'irrigation_technique_use'
  | 'irrigation_water_source_use'
  | 'irrigated_plot_share'
  | 'not_irrigated_reason_share'
  | 'extension_service_use'

export interface EvidenceRecord {
  readonly id: string
  readonly indicator: EvidenceIndicator
  readonly label: string
  readonly crop?: string
  readonly sourceCrop?: string
  readonly species?: string
  readonly category?: string
  readonly value: number | null
  readonly unit: string
  readonly geography: {
    readonly level: 'district' | 'province' | 'national' | 'other'
    readonly id: string
    readonly name: string
  }
  readonly period: {
    readonly year: string
    readonly season?: AgriculturalSeason
    readonly label?: string
  }
  readonly dataset: string
  readonly source: Extract<
    AgriculturalObservationSource,
    { readonly kind: 'nisr' }
  >
  readonly sourceReference: AgriculturalDataSourceReference
  readonly status: EvidenceStatus
  readonly referenceValue?: number
  readonly referenceLabel?: string
  readonly difference?: number
  readonly differenceUnit?: string
  readonly comparisonStatus?: 'derived'
  readonly derivedFromEvidenceIds?: readonly string[]
  readonly referenceEvidenceId?: string
}

export interface NISRDataInventoryRecord {
  readonly dataset: string
  readonly report: string
  readonly table: string
  readonly indicator: string
  readonly crop?: string
  readonly category?: string
  readonly geographyLevel: 'national' | 'province' | 'district' | 'other'
  readonly geography?: string
  readonly year: string
  readonly season?: AgriculturalSeason
  readonly unit?: string
  readonly available: boolean
  readonly sourcePage?: number
  readonly sourcePageLabel?: string
  readonly sourceTable: string
  readonly extractionStatus:
    | 'extracted'
    | 'unavailable'
    | 'catalogued_not_connected'
  readonly notes?: string
}

export interface EvidenceNavigationContext {
  readonly district: string
  readonly crop: string
  readonly year: string
  readonly season: AgriculturalSeason
  readonly intervention?: InterventionType
  readonly evidenceIds?: readonly string[]
}
