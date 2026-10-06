import type { DataSourceMetadata } from '../../../types/data-contract'

export type AttentionLevel = 'high' | 'medium' | 'low' | 'unavailable'

export interface OverviewFilters {
  readonly crop: string
  readonly season: string
  readonly year: string
}

export interface DistrictEvidence {
  districtId: string
  districtName: string
  attention: AttentionLevel

  crop: string
  season: string
  year: string

  productivity?: {
    production?: number
    area?: number
    yield?: number
  }

  interventionSignals?: {
    irrigation?: number
    improvedSeed?: number
    fertilizer?: number
    erosionControl?: number
  }

  source?: DataSourceMetadata
}
