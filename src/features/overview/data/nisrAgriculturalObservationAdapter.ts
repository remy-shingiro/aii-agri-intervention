import type {
  AgriculturalDataSourceReference,
  AgriculturalObservation,
  AgriculturalObservationSource,
  AgriculturalSeason,
} from '../../../types/data-contract'

export interface NisrAgriculturalSourceRecord {
  readonly geographyLevel: string
  readonly geographyName: string
  readonly production: number
  readonly cultivatedArea: number
  readonly yield: number
}

export interface NisrAgriculturalSourceDataset {
  readonly crop: string
  readonly season: string
  readonly agriculturalYear: string
  readonly productionUnit: string
  readonly cultivatedAreaUnit: string
  readonly yieldUnit: string
  readonly source: {
    readonly dataset: string
    readonly report: string
    readonly reportYear: number
    readonly sourceUrl: string
    readonly references: readonly AgriculturalDataSourceReference[]
  }
  readonly records: readonly NisrAgriculturalSourceRecord[]
}

function isAgriculturalSeason(value: string): value is AgriculturalSeason {
  return value === 'A' || value === 'B' || value === 'C'
}

function isValidSourceDataset(
  dataset: NisrAgriculturalSourceDataset,
): dataset is NisrAgriculturalSourceDataset & {
  readonly season: AgriculturalSeason
} {
  return (
    dataset.crop === 'Maize' &&
    isAgriculturalSeason(dataset.season) &&
    dataset.agriculturalYear.trim().length > 0 &&
    dataset.productionUnit === 'MT' &&
    dataset.cultivatedAreaUnit === 'Ha' &&
    dataset.yieldUnit === 'Kg/Ha' &&
    dataset.source.dataset.trim().length > 0 &&
    dataset.source.report.trim().length > 0 &&
    dataset.source.sourceUrl.startsWith('https://') &&
    Number.isInteger(dataset.source.reportYear) &&
    dataset.source.references.length > 0 &&
    dataset.source.references.every(
      (reference) =>
        reference.table.trim().length > 0 &&
        Number.isInteger(reference.page) &&
        reference.page > 0,
    )
  )
}

function isValidSourceRecord(record: NisrAgriculturalSourceRecord): boolean {
  return (
    record.geographyLevel === 'district' &&
    record.geographyName.trim().length > 0 &&
    record.geographyName === record.geographyName.trim() &&
    Number.isFinite(record.production) &&
    record.production >= 0 &&
    Number.isFinite(record.cultivatedArea) &&
    record.cultivatedArea > 0 &&
    Number.isFinite(record.yield) &&
    record.yield >= 0
  )
}

/** Maps verified NISR source rows to the app's district observation model. */
export function adaptNisrAgriculturalObservations(
  dataset: NisrAgriculturalSourceDataset,
): readonly AgriculturalObservation[] {
  if (!isValidSourceDataset(dataset) || !isAgriculturalSeason(dataset.season)) {
    return []
  }

  const season: AgriculturalSeason = dataset.season
  const source: AgriculturalObservationSource = {
    ...dataset.source,
    kind: 'nisr',
  }

  return dataset.records.flatMap((record) => {
    if (!isValidSourceRecord(record)) {
      return []
    }

    return [
      {
        geographyLevel: 'district',
        district: record.geographyName,
        crop: dataset.crop,
        season,
        agriculturalYear: dataset.agriculturalYear,
        productionTonnes: record.production,
        cultivatedAreaHectares: record.cultivatedArea,
        yieldKilogramsPerHectare: record.yield,
        source,
      },
    ]
  })
}
