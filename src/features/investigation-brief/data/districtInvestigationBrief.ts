import type { AgriculturalSeason } from '../../../types/data-contract'
import type { AgriculturalSignal } from '../../../types/agricultural-signal'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { calculateAgriculturalSignals } from '../../intelligence/agriculturalSignalEngine'
import { getDistrictMetadata } from '../../district-profile/data/districtMetadata'
import {
  getIrrigationEvidenceTrail,
  type IrrigationEvidenceTrail,
} from '../../district-profile/utils/irrigationEvidenceTrail'

export interface DistrictInvestigationBrief {
  readonly district: string
  readonly crop: string
  readonly year: string
  readonly season: AgriculturalSeason
  readonly signals: readonly AgriculturalSignal[]
  readonly records: readonly EvidenceRecord[]
  readonly irrigationTrail: IrrigationEvidenceTrail
  readonly questions: readonly string[]
}

function signalQuestions(
  signals: readonly AgriculturalSignal[],
  records: readonly EvidenceRecord[],
  district: string,
  crop: string,
): string[] {
  const questions: string[] = []
  const gap = signals.find((signal) => signal.signalType === 'productivity_gap')
  const trend = signals.find(
    (signal) => signal.signalType === 'productivity_trend',
  )
  const irrigation = signals.find(
    (signal) => signal.signalType === 'irrigation_investigation',
  )

  if (gap?.status === 'insufficient_evidence') {
    questions.push(
      `Can a comparable observed ${crop} yield and Rwanda reference be connected for ${district} in the selected period?`,
    )
  } else {
    questions.push(
      'Does additional district-level evidence help contextualize the selected yield comparison?',
    )
  }

  if (trend?.status === 'insufficient_evidence') {
    questions.push(
      'Are at least two comparable observed agricultural years available for this district, crop, and season?',
    )
  } else {
    questions.push(
      'What other reporting periods are available for a descriptive comparison, and are their definitions comparable?',
    )
  }

  if (irrigation?.status === 'insufficient_evidence') {
    questions.push(
      'Are matched district and national maize-yield and district-wide irrigation observations available for the selected period?',
    )
  } else {
    questions.push(
      'Is crop-specific practice evidence available to investigate alongside the district-wide agricultural practice percentage?',
    )
  }

  if (records.length === 0) {
    questions.push(
      'Which NISR district-level measurements would be needed before a comparison can be assessed?',
    )
  }

  return [...new Set(questions)]
}

/** Prepares a traceable brief from the existing signal engine and evidence rows. */
export function buildDistrictInvestigationBrief(
  district: string | undefined,
  crop: string,
  year: string,
  season: AgriculturalSeason,
  records: readonly EvidenceRecord[] = evidenceRecords,
): DistrictInvestigationBrief | undefined {
  if (!district) return undefined

  const normalizedYear = year.replace('-', '/')
  const [productivityGap, productivityTrend, irrigationInvestigation] =
    calculateAgriculturalSignals(records, {
      district,
      crop,
      year: normalizedYear,
      season,
    })
  const signals: readonly AgriculturalSignal[] = [
    productivityGap,
    productivityTrend,
    irrigationInvestigation,
  ]
  const evidenceIds = new Set(signals.flatMap((signal) => signal.evidenceIds))
  const selectedRecords = records.filter((record) => evidenceIds.has(record.id))
  const districtName = getDistrictMetadata(district)?.district
  const contextualCandidates = records.filter(
    (record) =>
      record.geography.level === 'district' &&
      getDistrictMetadata(record.geography.name)?.district === districtName &&
      record.period.year === normalizedYear &&
      record.period.season === season &&
      record.crop?.toLowerCase() === crop.toLowerCase() &&
      ['crop_production', 'cultivated_area'].includes(record.indicator),
  )
  const contextualDatasets = new Set(
    contextualCandidates.map((record) => record.dataset),
  )
  const contextualRecords =
    contextualDatasets.size === 1
      ? (['crop_production', 'cultivated_area'] as const).flatMap(
          (indicator) => {
            const matches = contextualCandidates.filter(
              (record) =>
                record.dataset === [...contextualDatasets][0] &&
                record.indicator === indicator,
            )
            return matches.length === 1 ? matches : []
          },
        )
      : []
  const selectedIds = new Set(selectedRecords.map((record) => record.id))
  const briefRecords = [
    ...selectedRecords,
    ...contextualRecords.filter((record) => !selectedIds.has(record.id)),
  ]

  return {
    district,
    crop,
    year: normalizedYear,
    season,
    signals,
    records: briefRecords,
    irrigationTrail: getIrrigationEvidenceTrail(
      irrigationInvestigation,
      records,
    ),
    questions: signalQuestions(signals, briefRecords, district, crop),
  }
}
