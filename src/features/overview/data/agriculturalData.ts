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

function sameObservationPeriod(
  first: EvidenceRecord,
  second: EvidenceRecord,
): boolean {
  return (
    first.dataset === second.dataset &&
    first.period.year === second.period.year &&
    first.period.season === second.period.season &&
    normalize(first.crop ?? '') === normalize(second.crop ?? '') &&
    first.geography.level === 'district' &&
    second.geography.level === 'district' &&
    first.geography.id === second.geography.id
  )
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

    const production = normalizedEvidenceRecords.find(
      (record) =>
        record.indicator === 'crop_production' &&
        record.status === 'observed' &&
        record.value !== null &&
        sameObservationPeriod(yieldRecord, record),
    )
    const area = normalizedEvidenceRecords.find(
      (record) =>
        record.indicator === 'cultivated_area' &&
        record.status === 'observed' &&
        record.value !== null &&
        sameObservationPeriod(yieldRecord, record),
    )
    if (!production || production.value === null || !area || area.value === null) {
      return []
    }

    const references = [area, yieldRecord, production].flatMap((record) =>
      record.source.references.filter(
        (reference) =>
          !yieldRecord.source.references.some(
            (existing) => existing.table === reference.table,
          ),
      ),
    )
    const source = {
      ...yieldRecord.source,
      references: [...yieldRecord.source.references, ...references],
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
  return getCompleteObservations()
}

export function getAgriculturalObservationsByDistrict(
  districtName: string,
): readonly AgriculturalObservation[] {
  const normalizedDistrictName = normalize(districtName)
  return getCompleteObservations().filter(
    (observation) => normalize(observation.district) === normalizedDistrictName,
  )
}

export function getAgriculturalObservationsByPeriod(
  period: AgriculturalObservationPeriod,
): readonly AgriculturalObservation[] {
  return getCompleteObservations().filter(
    (observation) =>
      observation.season === period.season &&
      observation.agriculturalYear === period.agriculturalYear,
  )
}
