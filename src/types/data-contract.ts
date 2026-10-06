/** Inspection status for the source datasets; the active source can remain mock. */
export type DataReadiness = 'awaiting-source-inspection' | 'source-inspected'

export interface AgriculturalDataSourceReference {
  readonly table: string
  readonly page?: number
}

export interface DataSourceMetadata {
  readonly dataset: string
  readonly report?: string
  readonly reportYear?: number
  readonly sourceUrl?: string
  readonly table?: string
  readonly page?: number
}

export type AgriculturalObservationSource =
  | (DataSourceMetadata & {
      readonly kind: 'mock'
    })
  | (DataSourceMetadata & {
      readonly kind: 'nisr'
      readonly report: string
      readonly reportYear: number
      readonly sourceUrl: string
      readonly references: readonly AgriculturalDataSourceReference[]
    })

export type AgriculturalSeason = 'A' | 'B' | 'C'
export type AgriculturalGeographyLevel = 'district' | 'province' | 'national'
export type AgriculturalYieldUnit = 'Kg/Ha'

/** A sourced benchmark used to compare agricultural observations. */
export interface AgriculturalYieldReference {
  readonly value: number
  readonly unit: AgriculturalYieldUnit
  readonly crop: string
  readonly season: AgriculturalSeason
  readonly agriculturalYear: string
  readonly geographyLevel: 'national'
  readonly source: Extract<
    AgriculturalObservationSource,
    { readonly kind: 'nisr' }
  >
}

/**
 * App-facing district observation; raw source records map into this model.
 * Yield uses kg/ha to match current consumers, with provenance kept alongside.
 */
export interface AgriculturalObservation {
  readonly geographyLevel: AgriculturalGeographyLevel
  readonly district: string
  readonly crop: string
  readonly season: AgriculturalSeason
  readonly agriculturalYear: string
  readonly productionTonnes: number
  readonly cultivatedAreaHectares: number
  readonly yieldKilogramsPerHectare: number
  readonly source: AgriculturalObservationSource
}

export interface DataContractStatus {
  readonly readiness: DataReadiness
  readonly datasets: readonly string[]
}

export const dataContractStatus: DataContractStatus = {
  readiness: 'source-inspected',
  datasets: ['AHS 2024', 'SAS 2024', 'SAS 2025'],
}
