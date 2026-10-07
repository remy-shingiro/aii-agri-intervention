import type {
  AgriculturalObservationSource,
  AgriculturalYieldReference,
} from '../../../types/data-contract'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type { InterventionSignal } from '../types/interventionSignal.types'
import { calculateInterventionSignal } from '../utils/calculateInterventionSignal'

type NisrSource = Extract<
  AgriculturalObservationSource,
  { readonly kind: 'nisr' }
>

export interface DistrictInsight {
  district: string
  crop: string
  source: NisrSource
  nationalYieldReference: AgriculturalYieldReference
  season: string
  year: string
  insight: string
  evidenceLabel: string
  totalProduction: string
  cultivatedArea: string
  averageYield: string
  inputUse: string
  yieldGapPct: number
  interventionSignal: InterventionSignal
  districtYieldRecord: EvidenceRecord
  nationalYieldRecord: EvidenceRecord
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

function createInsight(crop: string, district: string, gap: number): string {
  if (gap <= -20) {
    return `${crop} yield in ${district} is ${Math.abs(gap).toFixed(1)}% below the same-period national reference. This is a productivity gap for further investigation.`
  }
  if (gap <= -10) {
    return `${crop} yield in ${district} is ${Math.abs(gap).toFixed(1)}% below the same-period national reference.`
  }
  if (gap >= 10) {
    return `${crop} yield in ${district} is ${gap.toFixed(1)}% above the same-period national reference.`
  }
  return `${crop} yield in ${district} is close to the same-period national reference.`
}

export function getDistrictInsights(
  crop: string,
  season: string,
  year: string,
): DistrictInsight[] {
  const seasonCode = toSeason(season)
  if (!seasonCode) return []
  const agriculturalYear = toYear(year)

  return evidenceRecords.flatMap((districtYield) => {
    if (
      districtYield.indicator !== 'average_yield' ||
      districtYield.geography.level !== 'district' ||
      districtYield.status !== 'observed' ||
      districtYield.value === null ||
      normalize(districtYield.crop ?? '') !== normalize(crop) ||
      districtYield.period.year !== agriculturalYear ||
      districtYield.period.season !== seasonCode ||
      !districtYield.referenceEvidenceId ||
      districtYield.referenceValue === undefined ||
      districtYield.referenceValue <= 0
    ) {
      return []
    }

    const nationalYieldRecord = evidenceRecords.find(
      (record) => record.id === districtYield.referenceEvidenceId,
    )
    if (
      !nationalYieldRecord ||
      nationalYieldRecord.status !== 'observed' ||
      nationalYieldRecord.value === null
    ) {
      return []
    }

    const gap =
      ((districtYield.value - nationalYieldRecord.value) /
        nationalYieldRecord.value) *
      100
    const interventionSignal = calculateInterventionSignal({
      yield: districtYield.value,
      referenceYield: nationalYieldRecord.value,
    })
    const inPeriod = (record: EvidenceRecord) =>
      record.dataset === districtYield.dataset &&
      record.period.year === districtYield.period.year &&
      record.period.season === districtYield.period.season &&
      normalize(record.crop ?? '') === normalize(districtYield.crop ?? '') &&
      record.geography.level === 'district' &&
      record.geography.id === districtYield.geography.id
    const productionRecord = evidenceRecords.find(
      (record) => record.indicator === 'crop_production' && inPeriod(record),
    )
    const areaRecord = evidenceRecords.find(
      (record) => record.indicator === 'cultivated_area' && inPeriod(record),
    )
    const nationalYieldReference: AgriculturalYieldReference = {
      value: nationalYieldRecord.value,
      unit: 'Kg/Ha',
      crop: districtYield.crop ?? crop,
      season: seasonCode as AgriculturalYieldReference['season'],
      agriculturalYear,
      geographyLevel: 'national',
      source: nationalYieldRecord.source,
    }

    return [
      {
        district: districtYield.geography.name,
        crop: districtYield.crop ?? crop,
        source: districtYield.source,
        nationalYieldReference,
        season: `Season ${seasonCode}`,
        year: agriculturalYear,
        insight: createInsight(districtYield.crop ?? crop, districtYield.geography.name, gap),
        evidenceLabel: 'View evidence',
        totalProduction: formatValue(productionRecord),
        cultivatedArea: formatValue(areaRecord),
        averageYield: formatValue(districtYield),
        inputUse: 'See connected input observations in Evidence Explorer',
        yieldGapPct: gap,
        interventionSignal,
        districtYieldRecord: districtYield,
        nationalYieldRecord,
        ...(productionRecord ? { productionRecord } : {}),
        ...(areaRecord ? { areaRecord } : {}),
      },
    ]
  })
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
