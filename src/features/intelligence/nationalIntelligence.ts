import type { AgriculturalSeason } from '../../types/data-contract'
import {
  calculateAgriculturalSignals,
  type AgriculturalSignalContext,
} from './agriculturalSignalEngine'
import type { EvidenceRecord } from '../evidence/types/evidence.types'

export interface NationalIntelligenceScope {
  readonly crop: string
  readonly season?: AgriculturalSeason
  readonly year: string
}

export interface NationalIntelligenceSourceReference {
  readonly dataset: string
  readonly report: string
  readonly sourceUrl: string
  readonly table: string
  readonly page?: number
}

export interface NationalIntelligenceSummary {
  /** Distinct districts with a yield record for the selected crop and period. */
  readonly districtsInScope: number
  /** Distinct selected-period districts with an observed numeric yield row. */
  readonly observedYieldDistrictCount: number
  /** Districts whose selected-period yield can be compared to its reference. */
  readonly districtsAnalyzed: number
  readonly insufficientEvidenceCount: number
  readonly productivityGapCount: number
  readonly improvingDistrictCount: number
  readonly decliningDistrictCount: number
  readonly stableDistrictCount: number
  readonly trendInsufficientEvidenceCount: number
  readonly irrigationEvaluatedDistrictCount: number
  readonly irrigationInsufficientEvidenceCount: number
  readonly irrigationInvestigationCount: number
  readonly districtsBySignal: {
    readonly comparableYield: readonly string[]
    readonly insufficientYield: readonly string[]
    readonly productivityGap: readonly string[]
    readonly improving: readonly string[]
    readonly declining: readonly string[]
    readonly stable: readonly string[]
    readonly irrigationInvestigation: readonly string[]
    readonly irrigationInsufficient: readonly string[]
  }
  readonly sourceReferences: readonly NationalIntelligenceSourceReference[]
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeDistrict(value: string): string {
  return normalize(value).replace(/[\s_]+/g, '-')
}

function normalizeYear(value: string): string {
  return value.replace('-', '/')
}

function emptySummary(): NationalIntelligenceSummary {
  return {
    districtsInScope: 0,
    observedYieldDistrictCount: 0,
    districtsAnalyzed: 0,
    insufficientEvidenceCount: 0,
    productivityGapCount: 0,
    improvingDistrictCount: 0,
    decliningDistrictCount: 0,
    stableDistrictCount: 0,
    trendInsufficientEvidenceCount: 0,
    irrigationEvaluatedDistrictCount: 0,
    irrigationInsufficientEvidenceCount: 0,
    irrigationInvestigationCount: 0,
    districtsBySignal: {
      comparableYield: [],
      insufficientYield: [],
      productivityGap: [],
      improving: [],
      declining: [],
      stable: [],
      irrigationInvestigation: [],
      irrigationInsufficient: [],
    },
    sourceReferences: [],
  }
}

/**
 * Summarizes the existing district signals for yield records in the selected
 * crop and period. Unavailable yield rows stay in scope and are evaluated by
 * the signal engine as insufficient evidence.
 */
export function calculateNationalIntelligence(
  records: readonly EvidenceRecord[],
  scope: NationalIntelligenceScope,
): NationalIntelligenceSummary {
  if (!scope.season) return emptySummary()

  const districtNames = new Map<string, string>()
  const observedYieldDistricts = new Set<string>()
  for (const record of records) {
    if (
      record.indicator !== 'average_yield' ||
      record.geography.level !== 'district' ||
      normalize(record.crop ?? '') !== normalize(scope.crop) ||
      record.period.year !== normalizeYear(scope.year) ||
      record.period.season !== scope.season
    ) {
      continue
    }

    const key = normalizeDistrict(record.geography.name)
    if (key && !districtNames.has(key)) {
      districtNames.set(key, record.geography.name)
    }
    if (key && record.status === 'observed' && typeof record.value === 'number') {
      observedYieldDistricts.add(key)
    }
  }

  if (districtNames.size === 0) return emptySummary()

  const counts = {
    districtsAnalyzed: 0,
    insufficientEvidenceCount: 0,
    productivityGapCount: 0,
    improvingDistrictCount: 0,
    decliningDistrictCount: 0,
    stableDistrictCount: 0,
    trendInsufficientEvidenceCount: 0,
    irrigationEvaluatedDistrictCount: 0,
    irrigationInsufficientEvidenceCount: 0,
    irrigationInvestigationCount: 0,
  }
  const districtsBySignal: {
    comparableYield: string[]
    insufficientYield: string[]
    productivityGap: string[]
    improving: string[]
    declining: string[]
    stable: string[]
    irrigationInvestigation: string[]
    irrigationInsufficient: string[]
  } = {
    comparableYield: [],
    insufficientYield: [],
    productivityGap: [],
    improving: [],
    declining: [],
    stable: [],
    irrigationInvestigation: [],
    irrigationInsufficient: [],
  }
  const sourceReferences = new Map<
    string,
    NationalIntelligenceSourceReference
  >()
  const recordsById = new Map(records.map((record) => [record.id, record]))

  for (const district of districtNames.values()) {
    const context: AgriculturalSignalContext = {
      district,
      crop: scope.crop,
      year: normalizeYear(scope.year),
      season: scope.season,
    }
    const [productivityGap, productivityTrend, irrigationInvestigation] =
      calculateAgriculturalSignals(records, context)

    if (productivityGap.status === 'insufficient_evidence') {
      counts.insufficientEvidenceCount += 1
      districtsBySignal.insufficientYield.push(district)
    } else {
      counts.districtsAnalyzed += 1
      districtsBySignal.comparableYield.push(district)
      if (productivityGap.status === 'below_reference') {
        counts.productivityGapCount += 1
        districtsBySignal.productivityGap.push(district)
      }
    }

    if (productivityTrend.status === 'insufficient_evidence') {
      counts.trendInsufficientEvidenceCount += 1
    } else if (productivityTrend.status === 'improving') {
      counts.improvingDistrictCount += 1
      districtsBySignal.improving.push(district)
    } else if (productivityTrend.status === 'declining') {
      counts.decliningDistrictCount += 1
      districtsBySignal.declining.push(district)
    } else {
      counts.stableDistrictCount += 1
      districtsBySignal.stable.push(district)
    }

    if (irrigationInvestigation.status === 'insufficient_evidence') {
      counts.irrigationInsufficientEvidenceCount += 1
      districtsBySignal.irrigationInsufficient.push(district)
    } else {
      counts.irrigationEvaluatedDistrictCount += 1
    }
    if (irrigationInvestigation.status === 'supported') {
      counts.irrigationInvestigationCount += 1
      districtsBySignal.irrigationInvestigation.push(district)
    }

    for (const evidenceId of [
      ...productivityGap.sourceRecordIds,
      ...productivityTrend.sourceRecordIds,
      ...irrigationInvestigation.sourceRecordIds,
    ]) {
      const record = recordsById.get(evidenceId)
      if (!record) continue

      const reference = record.sourceReference
      const key = JSON.stringify([
        record.dataset,
        record.source.sourceUrl,
        reference.table,
        reference.page,
      ])
      sourceReferences.set(key, {
        dataset: record.dataset,
        report: record.source.report,
        sourceUrl: record.source.sourceUrl,
        table: reference.table,
        ...(reference.page !== undefined ? { page: reference.page } : {}),
      })
    }
  }

  return {
    districtsInScope: districtNames.size,
    observedYieldDistrictCount: observedYieldDistricts.size,
    ...counts,
    districtsBySignal,
    sourceReferences: [...sourceReferences.values()],
  }
}
