import type { EvidenceRecord } from '../types/evidence.types'
import {
  comparisonFor,
  normalizedEvidenceRecords,
} from './agriculturalEvidence'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function comparisonKey(record: EvidenceRecord): string {
  return [
    record.dataset,
    record.indicator,
    normalize(record.crop ?? ''),
    normalize(record.species ?? ''),
    record.period.year,
    record.period.season ?? '',
    record.period.label ?? '',
    record.unit,
  ].join('|')
}

const nationalRecordsByKey = new Map<string, EvidenceRecord>()
for (const record of normalizedEvidenceRecords) {
  if (record.geography.level === 'national') {
    nationalRecordsByKey.set(comparisonKey(record), record)
  }
}

const comparedObservations: readonly EvidenceRecord[] =
  normalizedEvidenceRecords.map((record) => {
    if (record.geography.level !== 'district' || record.status !== 'observed') {
      return record
    }

    const national = nationalRecordsByKey.get(comparisonKey(record))
    const comparison = national ? comparisonFor(record, national) : undefined
    if (!national || !comparison) return record

    return {
      ...record,
      referenceValue: comparison.nationalValue,
      referenceLabel: `National ${record.indicator.replaceAll('_', ' ')}`,
      referenceEvidenceId: comparison.nationalRecordId,
      difference: comparison.difference,
      differenceUnit:
        record.unit === '%' ? 'percentage points' : record.unit,
      comparisonStatus: 'derived',
    }
  })

const yieldGapRecords: readonly EvidenceRecord[] = comparedObservations.flatMap(
  (district) => {
    if (
      district.indicator !== 'average_yield' ||
      district.geography.level !== 'district' ||
      district.status !== 'observed' ||
      district.value === null ||
      district.referenceValue === undefined ||
      district.referenceValue <= 0 ||
      !district.referenceEvidenceId
    ) {
      return []
    }

    const value =
      ((district.value - district.referenceValue) / district.referenceValue) *
      100
    const national = comparedObservations.find(
      (record) => record.id === district.referenceEvidenceId,
    )
    if (!national) return []

    return [
      {
        ...district,
        id: `${district.id}-yield-gap`,
        indicator: 'yield_gap',
        label: `${district.crop ?? 'Crop'} yield gap vs national reference`,
        value,
        unit: '%',
        status: 'derived',
        referenceValue: 0,
        referenceLabel: 'National parity (0% gap)',
        difference: value,
        differenceUnit: '%',
        comparisonStatus: undefined,
        derivedFromEvidenceIds: [district.id, national.id],
      } satisfies EvidenceRecord,
    ]
  },
)

export const evidenceRecords: readonly EvidenceRecord[] = [
  ...comparedObservations,
  ...yieldGapRecords,
]
