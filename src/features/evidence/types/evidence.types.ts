import type {
  AgriculturalDataSourceReference,
  AgriculturalObservationSource,
  AgriculturalSeason,
} from '../../../types/data-contract'

export type EvidenceStatus = 'observed' | 'derived' | 'unavailable'

export type EvidenceIndicator =
  | 'average_yield'
  | 'yield_gap'
  | 'cultivated_area'
  | 'crop_production'
  | 'irrigation_practice'

export interface EvidenceRecord {
  readonly id: string
  readonly indicator: EvidenceIndicator
  readonly label: string
  readonly crop?: string
  readonly value: number | null
  readonly unit: string
  readonly geography: {
    readonly level: 'district'
    readonly id: string
    readonly name: string
  }
  readonly period: {
    readonly year: string
    readonly season: AgriculturalSeason
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
}
