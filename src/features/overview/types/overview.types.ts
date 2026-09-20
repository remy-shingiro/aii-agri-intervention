export type AttentionLevel = 'high' | 'medium' | 'low' | 'unavailable'

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

  source?: {
    dataset: string
    table?: string
    page?: number
  }
}