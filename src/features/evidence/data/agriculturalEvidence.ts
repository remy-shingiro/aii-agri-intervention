import normalizedObservations from '../../../../data/processed/agricultural-observations.json'
import normalizedInventory from '../../../../data/processed/agricultural-data-inventory.json'
import { districtMetadata } from '../../district-profile/data/districtMetadata'
import type {
  EvidenceRecord,
  NISRDataInventoryRecord,
} from '../types/evidence.types'

export const normalizedEvidenceRecords =
  normalizedObservations as unknown as readonly EvidenceRecord[]

export const nisrDataInventory =
  normalizedInventory as unknown as readonly NISRDataInventoryRecord[]

export interface CompatibleComparison {
  readonly districtValue: number
  readonly nationalValue: number
  readonly difference: number
  readonly unit: string
  readonly nationalRecordId: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function comparisonFor(
  district: EvidenceRecord,
  national: EvidenceRecord,
): CompatibleComparison | undefined {
  if (
    district.status !== 'observed' ||
    national.status !== 'observed' ||
    district.value === null ||
    national.value === null ||
    !Number.isFinite(district.value) ||
    !Number.isFinite(national.value) ||
    district.geography.level !== 'district' ||
    national.geography.level !== 'national' ||
    normalize(district.geography.id) === normalize(national.geography.id) ||
    district.dataset !== national.dataset ||
    district.indicator !== national.indicator ||
    normalize(district.crop ?? '') !== normalize(national.crop ?? '') ||
    normalize(district.species ?? '') !== normalize(national.species ?? '') ||
    normalize(district.category ?? '') !== normalize(national.category ?? '') ||
    district.period.year !== national.period.year ||
    district.period.season !== national.period.season ||
    district.period.label !== national.period.label ||
    district.unit !== national.unit
  ) {
    return undefined
  }

  return {
    districtValue: district.value,
    nationalValue: national.value,
    difference: district.value - national.value,
    unit: district.unit,
    nationalRecordId: national.id,
  }
}

export function validateEvidenceRecords(
  records: readonly EvidenceRecord[],
  knownDistricts: ReadonlySet<string> = new Set(
    districtMetadata.map((district) => normalize(district.district)),
  ),
): readonly string[] {
  const errors: string[] = []
  const knownProvinces = new Set(['kigali', 'south', 'west', 'north', 'east'])
  const observationKeys = new Set<string>()

  for (const record of records) {
    if (
      !record.id.trim() ||
      !record.indicator ||
      !record.dataset.trim() ||
      !record.unit.trim() ||
      !record.geography.id.trim() ||
      !record.geography.name.trim() ||
      !record.period.year.trim() ||
      !record.source.report.trim() ||
      record.source.dataset !== record.dataset ||
      !record.sourceReference.table.trim() ||
      record.source.kind !== 'nisr' ||
      !record.source.sourceUrl.startsWith('https://') ||
      !record.source.references.some(
        (reference) => reference.table === record.sourceReference.table,
      )
    ) {
      errors.push(`Missing required provenance or observation field: ${record.id}`)
    }

    if (
      record.sourceReference.page !== undefined &&
      (!Number.isInteger(record.sourceReference.page) ||
        record.sourceReference.page < 1)
    ) {
      errors.push(`Invalid source page: ${record.id}`)
    }

    if (
      !/^\d{4}\/\d{2}$/.test(record.period.year) ||
      (record.period.season !== undefined &&
        !['A', 'B', 'C'].includes(record.period.season))
    ) {
      errors.push(`Invalid period: ${record.id}`)
    }

    if (
      record.geography.level === 'district' &&
      !knownDistricts.has(normalize(record.geography.name))
    ) {
      errors.push(`Unknown district: ${record.geography.name}`)
    }
    if (
      record.geography.level === 'province' &&
      !knownProvinces.has(normalize(record.geography.name))
    ) {
      errors.push(`Unknown province: ${record.geography.name}`)
    }

    if (
      record.value !== null &&
      (!Number.isFinite(record.value) || record.value < 0)
    ) {
      errors.push(`Invalid numeric value: ${record.id}`)
    }

    if (
      record.status === 'unavailable' &&
      record.value !== null
    ) {
      errors.push(`Unavailable record has a value: ${record.id}`)
    }
    if (
      record.status === 'observed' &&
      (record.value === null || !Number.isFinite(record.value))
    ) {
      errors.push(`Observed record is missing a numeric value: ${record.id}`)
    }
    if (
      record.unit === '%' &&
      record.value !== null &&
      record.value > 100
    ) {
      errors.push(`Percentage exceeds 100: ${record.id}`)
    }

    const key = [
      record.dataset,
      record.indicator,
      normalize(record.crop ?? ''),
      normalize(record.species ?? ''),
      normalize(record.category ?? ''),
      record.geography.level,
      normalize(record.geography.id),
      record.period.year,
      record.period.season ?? '',
      record.period.label ?? '',
    ].join('|')
    if (observationKeys.has(key)) errors.push(`Duplicate observation: ${key}`)
    observationKeys.add(key)
  }

  return errors
}

export function findExactObservation(
  records: readonly EvidenceRecord[],
  requested: {
    readonly dataset: string
    readonly indicator: EvidenceRecord['indicator']
    readonly geographyId: string
    readonly geographyLevel: EvidenceRecord['geography']['level']
    readonly crop?: string
    readonly year: string
    readonly season?: EvidenceRecord['period']['season']
    readonly periodLabel?: string
  },
): EvidenceRecord | undefined {
  return records.find(
    (record) =>
      record.dataset === requested.dataset &&
      record.indicator === requested.indicator &&
      record.geography.level === requested.geographyLevel &&
      normalize(record.geography.id) === normalize(requested.geographyId) &&
      normalize(record.crop ?? '') === normalize(requested.crop ?? '') &&
      record.period.year === requested.year &&
      record.period.season === requested.season &&
      (requested.periodLabel === undefined ||
        record.period.label === requested.periodLabel),
  )
}

export function getAvailableCrops(
  records: readonly EvidenceRecord[] = normalizedEvidenceRecords,
  period?: { readonly year: string; readonly season?: string },
): readonly string[] {
  return [...new Set(
    records.flatMap((record) =>
      record.crop &&
      record.status === 'observed' &&
      (!period ||
        (record.period.year === period.year &&
          record.period.season === period.season))
        ? [record.crop]
        : [],
    ),
  )].sort((first, second) => first.localeCompare(second))
}
