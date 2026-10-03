/** Status for source-specific NISR integrations, which are not loaded yet. */
export type DataReadiness = 'awaiting-source-inspection'

export interface DataSourceMetadata {
  readonly dataset: string
  readonly table?: string
  readonly page?: number
}

export interface AgriculturalObservationSource extends DataSourceMetadata {
  readonly kind: 'mock' | 'nisr'
}

export type AgriculturalSeason = 'A' | 'B' | 'C'

/**
 * App-facing district observation; raw source records map into this model.
 * Yield uses kg/ha to match current consumers, with provenance kept alongside.
 */
export interface AgriculturalObservation {
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
  readiness: 'awaiting-source-inspection',
  datasets: ['AHS 2024', 'SAS 2024', 'SAS 2025'],
}
