import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { AgriculturalSeason } from '../../../types/data-contract'
import { calculateProductivityTrend } from '../../intelligence/agriculturalSignalEngine'

export type YieldHistorySelection =
  | {
      readonly status: 'available'
      readonly records: readonly EvidenceRecord[]
    }
  | {
      readonly status: 'insufficient' | 'invalid'
      readonly message: string
      readonly detail: string
    }

function agriculturalYearStart(year: string): number | undefined {
  const match = year.replace('-', '/').match(/^(\d{4})\/\d{2}$/)
  return match ? Number(match[1]) : undefined
}

export function getDistrictYieldHistory(
  records: readonly EvidenceRecord[],
  district: string,
  crop: string,
  season: AgriculturalSeason,
  selectedYear: string,
): YieldHistorySelection {
  const selectedYearStart = agriculturalYearStart(selectedYear)
  if (selectedYearStart === undefined) {
    return {
      status: 'insufficient',
      message: 'Yield history is unavailable for this period.',
      detail:
        'The selected agricultural year cannot be matched to observations.',
    }
  }

  const recordsThroughSelection = records.filter((record) => {
    if (
      record.indicator !== 'average_yield' ||
      record.geography.level !== 'district' ||
      record.geography.name.trim().toLowerCase() !==
        district.trim().toLowerCase() ||
      record.crop?.trim().toLowerCase() !== crop.trim().toLowerCase() ||
      record.period.season !== season
    ) {
      return false
    }

    const recordYearStart = agriculturalYearStart(record.period.year)
    return recordYearStart === undefined || recordYearStart <= selectedYearStart
  })
  const trend = calculateProductivityTrend(recordsThroughSelection, {
    district,
    crop,
    season,
    year: selectedYear,
  })

  if (trend.status === 'insufficient_evidence') {
    return {
      status: 'insufficient',
      message: trend.summary,
      detail: trend.rationale.join(' '),
    }
  }

  const recordsById = new Map(
    recordsThroughSelection.map((record) => [record.id, record]),
  )
  const history = trend.sourceRecordIds
    .map((id) => recordsById.get(id))
    .filter((record): record is EvidenceRecord => record !== undefined)
    .sort(
      (first, second) =>
        (agriculturalYearStart(first.period.year) ?? 0) -
        (agriculturalYearStart(second.period.year) ?? 0),
    )

  if (
    history.length < 2 ||
    history.length !== trend.periodsUsed.length ||
    history.some(
      (record) =>
        record.status !== 'observed' ||
        record.value === null ||
        !Number.isFinite(record.value) ||
        record.value < 0,
    )
  ) {
    return {
      status: 'invalid',
      message: 'Yield history cannot be charted safely.',
      detail:
        'One or more matching source values are invalid or ambiguous. No chart is drawn.',
    }
  }

  return { status: 'available', records: history }
}
