import type { AgriculturalObservationSource } from '../../../types/data-contract'
import {
  getAgriculturalObservations,
  getNationalMaizeYieldReference,
} from '../../overview/data/agriculturalData'
import { nisrSeasonA2025DistrictPractices } from '../../overview/data/nisrSeasonA2025DistrictPractices'
import { calculateInterventionSignal } from '../../overview/utils/calculateInterventionSignal'
import type { EvidenceIndicator, EvidenceRecord } from '../types/evidence.types'

type NisrSource = Extract<
  AgriculturalObservationSource,
  { readonly kind: 'nisr' }
>

function sourceReference(source: NisrSource, tableName: string) {
  const reference = source.references.find((item) =>
    item.table.includes(tableName),
  )

  if (!reference) {
    throw new Error(`Missing NISR source reference for ${tableName}`)
  }

  return reference
}

function districtId(name: string): string {
  return name.toLowerCase().replaceAll(' ', '-')
}

function createId(district: string, indicator: EvidenceIndicator): string {
  return `sas-2025-season-a-${districtId(district)}-${indicator}`
}

const nationalYieldReference = getNationalMaizeYieldReference()
const agriculturalObservations = getAgriculturalObservations()
const yieldReference = sourceReference(
  nationalYieldReference.source,
  'Table 19',
)

const cropEvidenceRecords: readonly EvidenceRecord[] =
  agriculturalObservations.flatMap((observation) => {
    const district = {
      level: 'district' as const,
      id: districtId(observation.district),
      name: observation.district,
    }
    const period = {
      year: observation.agriculturalYear,
      season: observation.season,
    }
    const signal = calculateInterventionSignal({
      yield: observation.yieldKilogramsPerHectare,
      referenceYield: nationalYieldReference.value,
    })

    if (observation.source.kind !== 'nisr') {
      return []
    }

    const common = {
      crop: observation.crop,
      geography: district,
      period,
      dataset: observation.source.dataset,
      source: observation.source,
    }

    return [
      {
        ...common,
        id: createId(observation.district, 'average_yield'),
        indicator: 'average_yield',
        label: 'Average maize yield',
        value: observation.yieldKilogramsPerHectare,
        unit: 'Kg/Ha',
        status: 'observed',
        sourceReference: sourceReference(observation.source, 'Table 19'),
        referenceValue: nationalYieldReference.value,
        referenceLabel: 'National maize yield',
        difference:
          observation.yieldKilogramsPerHectare - nationalYieldReference.value,
        differenceUnit: 'Kg/Ha',
        comparisonStatus: 'derived',
      },
      {
        ...common,
        id: createId(observation.district, 'yield_gap'),
        indicator: 'yield_gap',
        label: 'Yield gap vs national reference',
        value: signal.yieldGapPct,
        unit: '%',
        status: 'derived',
        derivedFromEvidenceIds: [
          createId(observation.district, 'average_yield'),
          createId('Rwanda', 'average_yield'),
        ],
        sourceReference: yieldReference,
        referenceValue: 0,
        referenceLabel: 'National parity (0% gap)',
        difference: signal.yieldGapPct,
        differenceUnit: 'percentage points',
      },
      {
        ...common,
        id: createId(observation.district, 'cultivated_area'),
        indicator: 'cultivated_area',
        label: 'Cultivated maize area',
        value: observation.cultivatedAreaHectares,
        unit: 'Ha',
        status: 'observed',
        sourceReference: sourceReference(observation.source, 'Table 13'),
      },
      {
        ...common,
        id: createId(observation.district, 'crop_production'),
        indicator: 'crop_production',
        label: 'Maize production',
        value: observation.productionTonnes,
        unit: 'MT',
        status: 'observed',
        sourceReference: sourceReference(observation.source, 'Table 24'),
      },
    ]
  })

const nationalYieldEvidenceRecord: EvidenceRecord = {
  id: createId('Rwanda', 'average_yield'),
  indicator: 'average_yield',
  label: 'National average maize yield',
  crop: nationalYieldReference.crop,
  value: nationalYieldReference.value,
  unit: nationalYieldReference.unit,
  geography: {
    level: 'national',
    id: 'rwanda',
    name: 'Rwanda',
  },
  period: {
    year: nationalYieldReference.agriculturalYear,
    season: nationalYieldReference.season,
  },
  dataset: nationalYieldReference.source.dataset,
  source: nationalYieldReference.source,
  sourceReference: yieldReference,
  status: 'observed',
}

const irrigationEvidenceRecords: readonly EvidenceRecord[] =
  nisrSeasonA2025DistrictPractices.records.map((observation) => ({
    id: createId(observation.district, 'irrigation_practice'),
    indicator: 'irrigation_practice',
    label: 'Farmers practicing irrigation',
    value: observation.irrigationPracticePct,
    unit: '%',
    geography: {
      level: 'district',
      id: districtId(observation.district),
      name: observation.district,
    },
    period: {
      year: nisrSeasonA2025DistrictPractices.agriculturalYear,
      season: nisrSeasonA2025DistrictPractices.season,
    },
    dataset: nisrSeasonA2025DistrictPractices.source.dataset,
    source: nisrSeasonA2025DistrictPractices.source,
    sourceReference: sourceReference(
      nisrSeasonA2025DistrictPractices.source,
      'Table 64',
    ),
    status: 'observed',
    referenceValue: nisrSeasonA2025DistrictPractices.nationalReference,
    referenceLabel: 'National irrigation practice estimate',
    difference:
      observation.irrigationPracticePct -
      nisrSeasonA2025DistrictPractices.nationalReference,
    differenceUnit: 'percentage points',
    comparisonStatus: 'derived',
  }))

const nationalIrrigationEvidenceRecord: EvidenceRecord = {
  id: createId('Rwanda', 'irrigation_practice'),
  indicator: 'irrigation_practice',
  label: 'National farmers practicing irrigation',
  value: nisrSeasonA2025DistrictPractices.nationalReference,
  unit: nisrSeasonA2025DistrictPractices.unit,
  geography: {
    level: 'national',
    id: 'rwanda',
    name: 'Rwanda',
  },
  period: {
    year: nisrSeasonA2025DistrictPractices.agriculturalYear,
    season: nisrSeasonA2025DistrictPractices.season,
  },
  dataset: nisrSeasonA2025DistrictPractices.source.dataset,
  source: nisrSeasonA2025DistrictPractices.source,
  sourceReference: sourceReference(
    nisrSeasonA2025DistrictPractices.source,
    'Table 64',
  ),
  status: 'observed',
}

export const evidenceRecords: readonly EvidenceRecord[] = [
  nationalYieldEvidenceRecord,
  ...cropEvidenceRecords,
  nationalIrrigationEvidenceRecord,
  ...irrigationEvidenceRecords,
]
