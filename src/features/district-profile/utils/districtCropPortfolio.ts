import { comparisonFor } from '../../evidence/data/agriculturalEvidence'
import type { EvidenceIndicator, EvidenceRecord } from '../../evidence/types/evidence.types'

export const districtCropPortfolioIndicators = [
  'cultivated_area',
  'crop_production',
  'average_yield',
] as const satisfies readonly EvidenceIndicator[]

export type DistrictCropPortfolioIndicator =
  (typeof districtCropPortfolioIndicators)[number]

export interface DistrictCropPortfolioMetric {
  readonly indicator: DistrictCropPortfolioIndicator
  readonly label: string
  readonly unit: string
  readonly districtRecords: readonly EvidenceRecord[]
  readonly nationalRecords: readonly EvidenceRecord[]
  readonly hasUnmatchedNationalRecords: boolean
  readonly districtRecord?: EvidenceRecord
  readonly nationalRecord?: EvidenceRecord
  readonly difference?: number
  readonly evidenceIds: readonly string[]
}

export interface DistrictCropPortfolioEntry {
  /** Normalized crop label from the processed observation. */
  readonly crop: string
  readonly species?: string
  readonly category?: string
  readonly metrics: Readonly<
    Record<DistrictCropPortfolioIndicator, DistrictCropPortfolioMetric>
  >
  readonly evidenceIds: readonly string[]
}

export interface DistrictCropYieldObservation {
  readonly label: string
  readonly value: number
  readonly unit: 'Kg/Ha'
  readonly record: EvidenceRecord
}

export interface DistrictCropYieldRanking {
  readonly observations: readonly DistrictCropYieldObservation[]
  readonly portfolioCropCount: number
  readonly missingOrAmbiguousCount: number
  readonly unavailableCount: number
  readonly invalidCount: number
}

/**
 * Ranks only uniquely matched, observed district yields already selected for
 * one compatible SAS period by getDistrictCropPortfolio. Zero is retained;
 * missing, ambiguous, unavailable, and invalid values remain out of the bars.
 */
export function rankObservedDistrictCropYields(
  portfolio: readonly DistrictCropPortfolioEntry[],
): DistrictCropYieldRanking {
  const observations: DistrictCropYieldObservation[] = []
  let missingOrAmbiguousCount = 0
  let unavailableCount = 0
  let invalidCount = 0

  for (const entry of portfolio) {
    const metric = entry.metrics.average_yield
    const candidates = metric.districtRecords
    const record = metric.districtRecord

    if (!record) {
      if (candidates.length === 0 || candidates.length > 1) {
        missingOrAmbiguousCount += 1
      } else {
        unavailableCount += 1
      }
      continue
    }

    if (record.status !== 'observed' || record.value === null) {
      unavailableCount += 1
      continue
    }

    if (!Number.isFinite(record.value) || record.value < 0) {
      invalidCount += 1
      continue
    }

    const qualifiers = [entry.species, entry.category].filter(Boolean)
    observations.push({
      label: qualifiers.length > 0
        ? `${entry.crop} (${qualifiers.join(' · ')})`
        : entry.crop,
      value: record.value,
      unit: 'Kg/Ha',
      record,
    })
  }

  observations.sort(
    (first, second) =>
      second.value - first.value || first.label.localeCompare(second.label),
  )

  return {
    observations,
    portfolioCropCount: portfolio.length,
    missingOrAmbiguousCount,
    unavailableCount,
    invalidCount,
  }
}

const indicatorDetails: Readonly<
  Record<
    DistrictCropPortfolioIndicator,
    { readonly label: string; readonly unit: string }
  >
> = {
  cultivated_area: { label: 'Cultivated area', unit: 'Ha' },
  crop_production: { label: 'Production', unit: 'MT' },
  average_yield: { label: 'Yield', unit: 'Kg/Ha' },
}

const datasetByYear: Readonly<Record<string, string>> = {
  '2023/24': 'SAS 2024',
  '2024/25': 'SAS 2025',
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function cropKey(record: EvidenceRecord): string {
  return [
    normalize(record.crop ?? ''),
    normalize(record.species ?? ''),
    normalize(record.category ?? ''),
  ].join('|')
}

function uniqueRecords(records: readonly EvidenceRecord[]): EvidenceRecord[] {
  const signaturesById = new Map<string, Set<string>>()
  return records.filter((record) => {
    const signatures = signaturesById.get(record.id) ?? new Set<string>()
    const signature = JSON.stringify(record)
    if (signatures.has(signature)) return false
    signatures.add(signature)
    signaturesById.set(record.id, signatures)
    return true
  })
}

function matchesPeriod(
  record: EvidenceRecord,
  dataset: string,
  year: string,
  season: string,
): boolean {
  return (
    record.dataset === dataset &&
    record.source.dataset === dataset &&
    record.period.year === year &&
    record.period.season === season
  )
}

function matchesDistrict(record: EvidenceRecord, district: string): boolean {
  return (
    record.geography.level === 'district' &&
    (normalize(record.geography.name) === normalize(district) ||
      normalize(record.geography.id) === normalize(district))
  )
}

function exactReferenceMatch(
  district: EvidenceRecord,
  national: EvidenceRecord,
): boolean {
  return (
    national.geography.level === 'national' &&
    normalize(national.geography.name) === 'rwanda' &&
    district.dataset === national.dataset &&
    district.source.dataset === national.source.dataset &&
    district.source.report === national.source.report &&
    district.indicator === national.indicator &&
    normalize(district.crop ?? '') === normalize(national.crop ?? '') &&
    normalize(district.sourceCrop ?? '') ===
      normalize(national.sourceCrop ?? '') &&
    normalize(district.species ?? '') === normalize(national.species ?? '') &&
    normalize(district.category ?? '') === normalize(national.category ?? '') &&
    district.period.year === national.period.year &&
    district.period.season === national.period.season &&
    district.period.label === national.period.label &&
    district.unit === national.unit &&
    district.sourceReference.table === national.sourceReference.table
  )
}

/**
 * Selects the selected district's crop observations for one SAS period. It
 * keeps each source crop category separate and derives a difference only for
 * one exact, observed district/national pair.
 */
export function getDistrictCropPortfolio(
  records: readonly EvidenceRecord[],
  district: string,
  year: string,
  season: string,
): readonly DistrictCropPortfolioEntry[] {
  const dataset = datasetByYear[year]
  if (!dataset || !['A', 'B', 'C'].includes(season)) return []

  const relevantRecords = records.filter((record) => {
    const indicator = districtCropPortfolioIndicators.find(
      (candidate) => candidate === record.indicator,
    )

    return (
      indicator !== undefined &&
      record.status !== 'derived' &&
      record.unit === indicatorDetails[indicator].unit &&
      record.crop !== undefined &&
      matchesPeriod(record, dataset, year, season)
    )
  })
  const districtRecords = relevantRecords.filter((record) =>
    matchesDistrict(record, district),
  )
  const nationalRecords = relevantRecords.filter(
    (record) => record.geography.level === 'national',
  )

  const cropRecords = new Map<string, EvidenceRecord[]>()
  for (const record of districtRecords) {
    const key = cropKey(record)
    const cropEntries = cropRecords.get(key) ?? []
    cropEntries.push(record)
    cropRecords.set(key, cropEntries)
  }

  return [...cropRecords.entries()]
    .map(([key, recordsForCrop]) => {
      const representative = recordsForCrop[0]
      const metrics = {} as Record<
        DistrictCropPortfolioIndicator,
        DistrictCropPortfolioMetric
      >

      for (const indicator of districtCropPortfolioIndicators) {
        const detail = indicatorDetails[indicator]
        const districtCandidates = uniqueRecords(
          recordsForCrop.filter((record) => record.indicator === indicator),
        )
        const districtRecord =
          districtCandidates.length === 1 ? districtCandidates[0] : undefined
        const allNationalCandidates = uniqueRecords(
          nationalRecords.filter(
            (record) =>
              cropKey(record) === key && record.indicator === indicator,
          ),
        )
        const compatibleNationalCandidates = districtRecord
          ? allNationalCandidates.filter((record) =>
              exactReferenceMatch(districtRecord, record),
            )
          : allNationalCandidates
        const nationalRecord =
          compatibleNationalCandidates.length === 1
            ? compatibleNationalCandidates[0]
            : undefined
        const comparison =
          districtRecord && nationalRecord
            ? comparisonFor(districtRecord, nationalRecord)
            : undefined
        const metricEvidenceRecords = [
          ...districtCandidates,
          ...compatibleNationalCandidates,
        ]

        metrics[indicator] = {
          indicator,
          label: detail.label,
          unit: detail.unit,
          districtRecords: districtCandidates,
          nationalRecords: compatibleNationalCandidates,
          hasUnmatchedNationalRecords:
            allNationalCandidates.length > 0 &&
            compatibleNationalCandidates.length === 0,
          ...(districtRecord ? { districtRecord } : {}),
          ...(nationalRecord ? { nationalRecord } : {}),
          ...(comparison ? { difference: comparison.difference } : {}),
          evidenceIds: [...new Set(metricEvidenceRecords.map((record) => record.id))],
        }
      }

      const entryEvidenceIds = [
        ...new Set(
          districtCropPortfolioIndicators.flatMap(
            (indicator) => metrics[indicator].evidenceIds,
          ),
        ),
      ]

      return {
        crop: representative.crop ?? '',
        ...(representative.species ? { species: representative.species } : {}),
        ...(representative.category ? { category: representative.category } : {}),
        metrics,
        evidenceIds: entryEvidenceIds,
      }
    })
    .sort((first, second) => first.crop.localeCompare(second.crop))
}
