import { comparisonFor } from '../../evidence/data/agriculturalEvidence'
import type {
  EvidenceIndicator,
  EvidenceRecord,
} from '../../evidence/types/evidence.types'

export const districtSeasonalPracticeIndicators = [
  'improved_seed_use',
  'organic_fertilizer_use',
  'inorganic_fertilizer_use',
  'pesticide_use',
  'erosion_control_practice',
  'agroforestry_practice',
  'mechanical_equipment_use',
] as const satisfies readonly EvidenceIndicator[]

export interface DistrictSeasonalPractice {
  readonly indicator: (typeof districtSeasonalPracticeIndicators)[number]
  readonly label: string
  readonly districtRecord?: EvidenceRecord
  readonly nationalRecord?: EvidenceRecord
  readonly difference?: number
  readonly evidenceIds: readonly string[]
}

const indicatorLabels: Readonly<
  Record<(typeof districtSeasonalPracticeIndicators)[number], string>
> = {
  improved_seed_use: 'Improved seed use',
  organic_fertilizer_use: 'Organic fertilizer use',
  inorganic_fertilizer_use: 'Inorganic fertilizer use',
  pesticide_use: 'Pesticide use',
  erosion_control_practice: 'Erosion control practice',
  agroforestry_practice: 'Agroforestry practice',
  mechanical_equipment_use: 'Mechanical equipment use',
}

const datasetByYear: Readonly<Record<string, string>> = {
  '2023/24': 'SAS 2024',
  '2024/25': 'SAS 2025',
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function hasDistrictWidePercentage(
  record: EvidenceRecord,
  indicator: (typeof districtSeasonalPracticeIndicators)[number],
  dataset: string,
  year: string,
  season: string,
): boolean {
  return (
    record.dataset === dataset &&
    record.source.dataset === dataset &&
    record.indicator === indicator &&
    record.unit === '%' &&
    record.crop === undefined &&
    record.sourceCrop === undefined &&
    record.species === undefined &&
    record.period.year === year &&
    record.period.season === season
  )
}

function sameComparisonDimensions(
  district: EvidenceRecord,
  national: EvidenceRecord,
): boolean {
  return (
    district.dataset === national.dataset &&
    district.source.dataset === national.source.dataset &&
    district.source.report === national.source.report &&
    district.indicator === national.indicator &&
    district.unit === national.unit &&
    district.crop === national.crop &&
    district.sourceCrop === national.sourceCrop &&
    district.species === national.species &&
    district.category === national.category &&
    district.period.year === national.period.year &&
    district.period.season === national.period.season &&
    district.period.label === national.period.label &&
    district.sourceReference.table === national.sourceReference.table &&
    district.sourceReference.page === national.sourceReference.page
  )
}

/**
 * Selects district-wide SAS practice observations for one selected district,
 * agricultural year, and season. Differences are computed only from a
 * comparable observed district and national pair.
 */
export function getDistrictSeasonalPracticeProfile(
  records: readonly EvidenceRecord[],
  districtName: string,
  year: string,
  season: string,
): readonly DistrictSeasonalPractice[] {
  const dataset = datasetByYear[year]
  const districtRecords = new Map<
    (typeof districtSeasonalPracticeIndicators)[number],
    EvidenceRecord
  >()
  const nationalRecords = new Map<
    (typeof districtSeasonalPracticeIndicators)[number],
    EvidenceRecord
  >()

  if (dataset) {
    for (const record of records) {
      if (
        !districtSeasonalPracticeIndicators.includes(
          record.indicator as (typeof districtSeasonalPracticeIndicators)[number],
        ) ||
        !hasDistrictWidePercentage(
          record,
          record.indicator as (typeof districtSeasonalPracticeIndicators)[number],
          dataset,
          year,
          season,
        )
      ) {
        continue
      }

      const indicator = record.indicator as
        (typeof districtSeasonalPracticeIndicators)[number]
      if (
        record.geography.level === 'district' &&
        (normalize(record.geography.name) === normalize(districtName) ||
          normalize(record.geography.id) === normalize(districtName)) &&
        !districtRecords.has(indicator)
      ) {
        districtRecords.set(indicator, record)
      } else if (
        record.geography.level === 'national' &&
        normalize(record.geography.name) === 'rwanda' &&
        !nationalRecords.has(indicator)
      ) {
        nationalRecords.set(indicator, record)
      }
    }
  }

  return districtSeasonalPracticeIndicators.map((indicator) => {
    const districtRecord = districtRecords.get(indicator)
    const nationalCandidate = nationalRecords.get(indicator)
    const nationalRecord =
      !districtRecord ||
      (nationalCandidate &&
        sameComparisonDimensions(districtRecord, nationalCandidate))
        ? nationalCandidate
        : undefined

    const comparison =
      districtRecord && nationalRecord &&
      districtRecord.source.report === nationalRecord.source.report &&
      districtRecord.sourceReference.table ===
        nationalRecord.sourceReference.table &&
      districtRecord.sourceReference.page === nationalRecord.sourceReference.page
        ? comparisonFor(districtRecord, nationalRecord)
        : undefined

    const difference =
      comparison && districtRecord?.unit === '%'
        ? comparison.difference
        : undefined
    const evidenceIds = [districtRecord?.id, nationalRecord?.id].filter(
      (id): id is string => id !== undefined,
    )

    return {
      indicator,
      label: indicatorLabels[indicator],
      ...(districtRecord ? { districtRecord } : {}),
      ...(nationalRecord ? { nationalRecord } : {}),
      ...(difference !== undefined ? { difference } : {}),
      evidenceIds,
    }
  })
}
