import type { AgriculturalSeason } from '../../../types/data-contract'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'

export interface DistrictMapEvidenceSummary {
  readonly districtYield?: EvidenceRecord
  readonly nationalYield?: EvidenceRecord
  readonly districtIrrigation?: EvidenceRecord
  readonly nationalIrrigation?: EvidenceRecord
}

interface DistrictMapEvidenceFilters {
  readonly crop: string
  readonly year: string
  readonly season: AgriculturalSeason
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/** Indexes only evidence from the active year and season for map hover lookup. */
export function createDistrictMapEvidenceLookup(
  records: readonly EvidenceRecord[],
  filters: DistrictMapEvidenceFilters,
): ReadonlyMap<string, DistrictMapEvidenceSummary> {
  const summaries = new Map<string, DistrictMapEvidenceSummary>()
  const matchingRecords = records.filter((record) =>
    record.period.year === filters.year &&
    record.period.season === filters.season &&
    ((record.indicator === 'average_yield' &&
      normalize(record.crop ?? '') === normalize(filters.crop)) ||
      record.indicator === 'irrigation_practice'),
  )
  const datasets = new Set(matchingRecords.map((record) => record.dataset))
  if (datasets.size !== 1) return summaries
  const [dataset] = datasets
  let nationalYield: EvidenceRecord | undefined
  let nationalIrrigation: EvidenceRecord | undefined

  for (const record of matchingRecords) {
    if (
      record.dataset !== dataset ||
      record.period.year !== filters.year ||
      record.period.season !== filters.season
    ) {
      continue
    }

    if (
      record.indicator === 'average_yield' &&
      normalize(record.crop ?? '') === normalize(filters.crop) &&
      record.status === 'observed' &&
      record.value !== null &&
      Number.isFinite(record.value)
    ) {
      if (record.geography.level === 'national') {
        nationalYield = record
      } else if (record.geography.level === 'district') {
        const key = normalize(record.geography.name)
        const current = summaries.get(key) ?? {}
        summaries.set(key, { ...current, districtYield: record })
      }
    }

    if (
      record.indicator === 'irrigation_practice' &&
      record.status === 'observed' &&
      record.value !== null &&
      Number.isFinite(record.value)
    ) {
      if (record.geography.level === 'national') {
        nationalIrrigation = record
      } else if (record.geography.level === 'district') {
        const key = normalize(record.geography.name)
        const current = summaries.get(key) ?? {}
        summaries.set(key, { ...current, districtIrrigation: record })
      }
    }
  }

  for (const [district, summary] of summaries) {
    summaries.set(district, {
      ...summary,
      nationalYield,
      nationalIrrigation,
    })
  }

  return summaries
}
