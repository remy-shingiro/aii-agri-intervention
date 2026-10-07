import type { InterventionSignal } from '../../../types/intervention'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'

type ObservedEvidenceRecord = EvidenceRecord & {
  readonly status: 'observed'
  readonly value: number
}

export interface IrrigationEvidenceTrailRecords {
  readonly districtYield: ObservedEvidenceRecord
  readonly nationalYield: ObservedEvidenceRecord
  readonly districtIrrigation: ObservedEvidenceRecord
  readonly nationalIrrigation: ObservedEvidenceRecord
}

export type IrrigationEvidenceTrail =
  | {
      readonly status: 'available'
      readonly records: IrrigationEvidenceTrailRecords
      readonly yieldDifference: number
      readonly irrigationDifference: number
      readonly evidenceIds: readonly [string, string, string, string]
    }
  | { readonly status: 'insufficient_evidence' }

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function isObservedNisrRecord(
  record: EvidenceRecord | undefined,
): record is ObservedEvidenceRecord {
  return (
    record?.status === 'observed' &&
    typeof record.value === 'number' &&
    Number.isFinite(record.value) &&
    record.source.kind === 'nisr' &&
    record.source.dataset.trim().length > 0 &&
    record.source.sourceUrl.startsWith('https://') &&
    record.sourceReference.table.trim().length > 0
  )
}

function matchesPeriod(
  record: EvidenceRecord,
  signal: InterventionSignal,
): boolean {
  return (
    record.period.year === signal.period.year &&
    record.period.season === signal.period.season
  )
}

/**
 * Resolves and validates the four existing observations emitted by the
 * intervention engine. Differences are recalculated from those observations;
 * no missing or mismatched record is filled from another period or geography.
 */
export function getIrrigationEvidenceTrail(
  signal: InterventionSignal,
  records: readonly EvidenceRecord[],
): IrrigationEvidenceTrail {
  if (
    signal.intervention !== 'irrigation' ||
    normalize(signal.period.crop) !== 'maize' ||
    signal.evidenceIds.length !== 4 ||
    new Set(signal.evidenceIds).size !== 4
  ) {
    return { status: 'insufficient_evidence' }
  }

  const signalEvidenceIds = new Set(signal.evidenceIds)
  const signalRecords = records.filter((record) =>
    signalEvidenceIds.has(record.id),
  )

  if (signalRecords.length !== 4) {
    return { status: 'insufficient_evidence' }
  }

  const districtYield = signalRecords.find(
    (record) =>
      record.indicator === 'average_yield' &&
      record.geography.level === 'district',
  )
  const nationalYield = signalRecords.find(
    (record) =>
      record.indicator === 'average_yield' &&
      record.geography.level === 'national',
  )
  const districtIrrigation = signalRecords.find(
    (record) =>
      record.indicator === 'irrigation_practice' &&
      record.geography.level === 'district',
  )
  const nationalIrrigation = signalRecords.find(
    (record) =>
      record.indicator === 'irrigation_practice' &&
      record.geography.level === 'national',
  )

  if (
    !isObservedNisrRecord(districtYield) ||
    !isObservedNisrRecord(nationalYield) ||
    !isObservedNisrRecord(districtIrrigation) ||
    !isObservedNisrRecord(nationalIrrigation)
  ) {
    return { status: 'insufficient_evidence' }
  }

  const samePeriod = signalRecords.every((record) =>
    matchesPeriod(record, signal),
  )
  const validYieldPair =
    normalize(districtYield.crop ?? '') === normalize(signal.period.crop) &&
    normalize(nationalYield.crop ?? '') === normalize(signal.period.crop) &&
    districtYield.unit === nationalYield.unit &&
    districtYield.geography.id === districtIrrigation.geography.id &&
    districtYield.geography.name === districtIrrigation.geography.name &&
    districtYield.referenceEvidenceId === nationalYield.id &&
    districtYield.referenceValue === nationalYield.value &&
    districtYield.difference === districtYield.value - nationalYield.value &&
    districtYield.differenceUnit === districtYield.unit &&
    districtYield.dataset === nationalYield.dataset &&
    districtYield.sourceReference.table === nationalYield.sourceReference.table
  const validIrrigationPair =
    districtIrrigation.crop === undefined &&
    nationalIrrigation.crop === undefined &&
    districtIrrigation.unit === nationalIrrigation.unit &&
    districtIrrigation.geography.id === districtYield.geography.id &&
    districtIrrigation.geography.name === districtYield.geography.name &&
    nationalIrrigation.geography.id === nationalYield.geography.id &&
    nationalIrrigation.geography.name === nationalYield.geography.name &&
    districtIrrigation.referenceEvidenceId === nationalIrrigation.id &&
    districtIrrigation.referenceValue === nationalIrrigation.value &&
    districtIrrigation.difference ===
      districtIrrigation.value - nationalIrrigation.value &&
    districtIrrigation.differenceUnit === 'percentage points' &&
    districtIrrigation.dataset === nationalIrrigation.dataset &&
    districtIrrigation.sourceReference.table ===
      nationalIrrigation.sourceReference.table

  if (!samePeriod || !validYieldPair || !validIrrigationPair) {
    return { status: 'insufficient_evidence' }
  }

  return {
    status: 'available',
    records: {
      districtYield,
      nationalYield,
      districtIrrigation,
      nationalIrrigation,
    },
    yieldDifference: districtYield.value - nationalYield.value,
    irrigationDifference:
      districtIrrigation.value - nationalIrrigation.value,
    evidenceIds: [
      districtYield.id,
      nationalYield.id,
      districtIrrigation.id,
      nationalIrrigation.id,
    ],
  }
}
