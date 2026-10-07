import type {
  AgriculturalObservation,
  AgriculturalYieldReference,
} from '../../../types/data-contract'
import { normalizedEvidenceRecords } from '../../evidence/data/agriculturalEvidence'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'

export interface AgriculturalObservationPeriod {
  readonly season: AgriculturalObservation['season']
  readonly agriculturalYear: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function observationKey(record: EvidenceRecord): string {
  return [
    record.dataset,
    record.period.year,
    record.period.season ?? '',
    normalize(record.crop ?? ''),
    normalize(record.geography.id),
  ].join('|')
}

const observedDistrictRecordsByKey = new Map<
  string,
  Map<EvidenceRecord['indicator'], EvidenceRecord>
>()
for (const record of normalizedEvidenceRecords) {
  if (
    record.geography.level !== 'district' ||
    record.status !== 'observed' ||
    record.value === null
  ) {
    continue
  }

  const key = observationKey(record)
  const matchingIndicators =
    observedDistrictRecordsByKey.get(key) ??
    new Map<EvidenceRecord['indicator'], EvidenceRecord>()
  matchingIndicators.set(record.indicator, record)
  observedDistrictRecordsByKey.set(key, matchingIndicators)
}

function getCompleteObservations(): readonly AgriculturalObservation[] {
  return normalizedEvidenceRecords.flatMap((yieldRecord) => {
    if (
      yieldRecord.indicator !== 'average_yield' ||
      yieldRecord.geography.level !== 'district' ||
      yieldRecord.status !== 'observed' ||
      yieldRecord.value === null ||
      !yieldRecord.period.season
    ) {
      return []
    }

    const matchingRecords = observedDistrictRecordsByKey.get(
      observationKey(yieldRecord),
    )
    const production = matchingRecords?.get('crop_production')
    const area = matchingRecords?.get('cultivated_area')
    if (!production || production.value === null || !area || area.value === null) {
      return []
    }

    const references = [area, yieldRecord, production].flatMap(
      (record, index, sourceRecords) =>
        record.source.references.filter(
          (reference) =>
            !sourceRecords
              .slice(0, index)
              .some((prior) =>
                prior.source.references.some(
                  (existing) => existing.table === reference.table,
                ),
              ),
        ),
    )
    const source = {
      ...yieldRecord.source,
      references,
    }

    return [
      {
        geographyLevel: 'district',
        district: yieldRecord.geography.name,
        crop: yieldRecord.crop ?? '',
        season: yieldRecord.period.season,
        agriculturalYear: yieldRecord.period.year,
        productionTonnes: production.value,
        cultivatedAreaHectares: area.value,
        yieldKilogramsPerHectare: yieldRecord.value,
        source,
      },
    ]
  })
}

function getLegacyMaizeSeasonAObservations(): readonly AgriculturalObservation[] {
  return getCompleteObservations().filter(
    (observation) =>
      observation.source.kind === 'nisr' &&
      observation.source.dataset === 'SAS 2025' &&
      observation.crop === 'Maize' &&
      observation.season === 'A' &&
      observation.agriculturalYear === '2024/25',
  )
}

export function getNationalMaizeYieldReference(): AgriculturalYieldReference {
  const nationalRecord = normalizedEvidenceRecords.find(
    (record) =>
      record.dataset === 'SAS 2025' &&
      record.indicator === 'average_yield' &&
      record.crop === 'Maize' &&
      record.geography.level === 'national' &&
      record.period.year === '2024/25' &&
      record.period.season === 'A' &&
      record.status === 'observed' &&
      record.value !== null,
  )
  if (!nationalRecord || nationalRecord.value === null) {
    throw new Error('SAS 2025 national maize yield is unavailable')
  }
  return {
    value: nationalRecord.value,
    unit: 'Kg/Ha',
    crop: nationalRecord.crop ?? 'Maize',
    season: 'A',
    agriculturalYear: nationalRecord.period.year,
    geographyLevel: 'national',
    source: nationalRecord.source,
  }
}

export function getAgriculturalObservations(): readonly AgriculturalObservation[] {
  return getLegacyMaizeSeasonAObservations()
}

export function getAgriculturalObservationsByDistrict(
  districtName: string,
): readonly AgriculturalObservation[] {
  const normalizedDistrictName = normalize(districtName)
  return getLegacyMaizeSeasonAObservations().filter(
    (observation) => normalize(observation.district) === normalizedDistrictName,
  )
}

export function getAgriculturalObservationsByPeriod(
  period: AgriculturalObservationPeriod,
): readonly AgriculturalObservation[] {
  return getLegacyMaizeSeasonAObservations().filter(
    (observation) =>
      observation.season === period.season &&
      observation.agriculturalYear === period.agriculturalYear,
  )
}
