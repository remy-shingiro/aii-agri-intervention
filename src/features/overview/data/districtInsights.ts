import type {
  AgriculturalObservationSource,
  AgriculturalYieldReference,
} from '../../../types/data-contract'
import type { ProductivityGapSignal } from '../../../types/agricultural-signal'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import { calculateProductivityGap } from '../../intelligence/agriculturalSignalEngine'

type NisrSource = Extract<
  AgriculturalObservationSource,
  { readonly kind: 'nisr' }
>

export interface DistrictInsight {
  district: string
  crop: string
  source: NisrSource
  nationalYieldReference?: AgriculturalYieldReference
  season: string
  year: string
  insight: string
  evidenceLabel: string
  totalProduction: string
  cultivatedArea: string
  averageYield: string
  inputUse: string
  productivityGap: ProductivityGapSignal
  districtYieldRecord: EvidenceRecord
  nationalYieldRecord?: EvidenceRecord
  productionRecord?: EvidenceRecord
  areaRecord?: EvidenceRecord
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function toYear(value: string): string {
  return value.replace('-', '/')
}

function toSeason(value: string): string | undefined {
  return ({
    'season-a': 'A',
    'season-b': 'B',
    'season-c': 'C',
  })[value]
}

function periodKey(record: EvidenceRecord): string {
  return [
    record.dataset,
    record.period.year,
    record.period.season,
    normalize(record.crop ?? ''),
    normalize(record.geography.id),
  ].join('|')
}

const recordsById = new Map(evidenceRecords.map((record) => [record.id, record]))
const districtRecordsByPeriod = new Map<string, EvidenceRecord[]>()
for (const record of evidenceRecords) {
  if (record.geography.level !== 'district') continue
  const key = periodKey(record)
  const group = districtRecordsByPeriod.get(key) ?? []
  group.push(record)
  districtRecordsByPeriod.set(key, group)
}
const districtInsightsBySelection = new Map<string, DistrictInsight[]>()

function formatValue(record: EvidenceRecord | undefined): string {
  if (record?.status !== 'observed' || record.value === null) {
    return 'Unavailable'
  }

  const formatted = record.value.toLocaleString('en-RW', {
    maximumFractionDigits: record.unit === '%' ? 1 : 0,
  })
  const unit = record.unit === 'MT' ? 'tonnes' : record.unit.toLowerCase()
  return `${formatted} ${unit}`
}

export function getDistrictInsights(
  crop: string,
  season: string,
  year: string,
): DistrictInsight[] {
  const seasonCode = toSeason(season)
  if (!seasonCode) return []
  const agriculturalYear = toYear(year)
  const selectionKey = JSON.stringify([normalize(crop), seasonCode, agriculturalYear])
  const cached = districtInsightsBySelection.get(selectionKey)
  if (cached) return cached

  const insights = evidenceRecords.flatMap((districtYield) => {
    if (
      districtYield.indicator !== 'average_yield' ||
      districtYield.geography.level !== 'district' ||
      districtYield.status !== 'observed' ||
      districtYield.value === null ||
      normalize(districtYield.crop ?? '') !== normalize(crop) ||
      districtYield.period.year !== agriculturalYear ||
      districtYield.period.season !== seasonCode
    ) {
      return []
    }

    const productivityGap = calculateProductivityGap(evidenceRecords, {
      district: districtYield.geography.name,
      crop: districtYield.crop ?? crop,
      year: agriculturalYear,
      season: seasonCode as AgriculturalYieldReference['season'],
    })
    const nationalYieldRecord =
      productivityGap.status === 'insufficient_evidence'
        ? undefined
        : recordsById.get(
            productivityGap.observedEvidenceIds.find((id) => id !== districtYield.id) ?? '',
          )

    const supportingRecords = districtRecordsByPeriod.get(periodKey(districtYield)) ?? []
    const productionRecord = supportingRecords.find(
      (record) => record.indicator === 'crop_production',
    )
    const areaRecord = supportingRecords.find(
      (record) => record.indicator === 'cultivated_area',
    )
    const nationalYieldReference: AgriculturalYieldReference | undefined =
      nationalYieldRecord?.status === 'observed' && nationalYieldRecord.value !== null
        ? {
            value: nationalYieldRecord.value,
            unit: 'Kg/Ha',
            crop: districtYield.crop ?? crop,
            season: seasonCode as AgriculturalYieldReference['season'],
            agriculturalYear,
            geographyLevel: 'national',
            source: nationalYieldRecord.source,
          }
        : undefined

    return [
      {
        district: districtYield.geography.name,
        crop: districtYield.crop ?? crop,
        source: districtYield.source,
        ...(nationalYieldReference ? { nationalYieldReference } : {}),
        season: `Season ${seasonCode}`,
        year: agriculturalYear,
        insight: productivityGap.summary,
        evidenceLabel: 'View evidence',
        totalProduction: formatValue(productionRecord),
        cultivatedArea: formatValue(areaRecord),
        averageYield: formatValue(districtYield),
        inputUse: 'See connected input observations in Evidence Explorer',
        productivityGap,
        districtYieldRecord: districtYield,
        ...(nationalYieldRecord ? { nationalYieldRecord } : {}),
        ...(productionRecord ? { productionRecord } : {}),
        ...(areaRecord ? { areaRecord } : {}),
      },
    ]
  })
  districtInsightsBySelection.set(selectionKey, insights)
  return insights
}

export function getDistrictInsight(
  districtName: string | undefined,
  crop = 'maize',
  season = 'season-a',
  year = '2024-25',
): DistrictInsight | undefined {
  if (!districtName) return undefined
  return getDistrictInsights(crop, season, year).find(
    (district) => normalize(district.district) === normalize(districtName),
  )
}
