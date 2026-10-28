import { comparisonFor } from '../../evidence/data/agriculturalEvidence'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { AgriculturalSeason } from '../../../types/data-contract'

export interface AgriculturalOpportunityFilters {
  readonly crop: string
  readonly season: AgriculturalSeason
  readonly year: string
  readonly district?: string
}

export interface AgriculturalOpportunityComparison {
  readonly districtRecord: EvidenceRecord
  readonly nationalRecord: EvidenceRecord
  readonly difference: number
  readonly unit: string
}

export interface AgriculturalOpportunityResults {
  readonly comparisons: readonly AgriculturalOpportunityComparison[]
  readonly unavailable: readonly EvidenceRecord[]
  readonly insufficient: readonly EvidenceRecord[]
  readonly matchingDistrictRecordCount: number
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function getAgriculturalOpportunities(
  records: readonly EvidenceRecord[],
  filters: AgriculturalOpportunityFilters,
): AgriculturalOpportunityResults {
  const year = filters.year.replace('-', '/')
  const districtRecords = records
    .filter(
      (record) =>
        record.indicator === 'average_yield' &&
        record.geography.level === 'district' &&
        normalize(record.crop ?? '') === normalize(filters.crop) &&
        record.period.year === year &&
        record.period.season === filters.season &&
        (!filters.district ||
          normalize(record.geography.name) === normalize(filters.district)),
    )
    .sort((first, second) =>
      first.geography.name.localeCompare(second.geography.name),
    )

  const nationalRecords = records.filter(
    (record) =>
      record.indicator === 'average_yield' &&
      record.geography.level === 'national',
  )

  const comparisons: AgriculturalOpportunityComparison[] = []
  const unavailable: EvidenceRecord[] = []
  const insufficient: EvidenceRecord[] = []

  for (const districtRecord of districtRecords) {
    if (
      districtRecord.status === 'unavailable' ||
      districtRecord.value === null
    ) {
      unavailable.push(districtRecord)
      continue
    }

    const matchingNational = nationalRecords
      .map((nationalRecord) => ({
        nationalRecord,
        comparison: comparisonFor(districtRecord, nationalRecord),
      }))
      .find((candidate) => candidate.comparison !== undefined)

    if (!matchingNational?.comparison) {
      insufficient.push(districtRecord)
      continue
    }

    comparisons.push({
      districtRecord,
      nationalRecord: matchingNational.nationalRecord,
      difference: matchingNational.comparison.difference,
      unit: matchingNational.comparison.unit,
    })
  }

  return {
    comparisons,
    unavailable,
    insufficient,
    matchingDistrictRecordCount: districtRecords.length,
  }
}
