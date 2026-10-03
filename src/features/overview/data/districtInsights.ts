import type { InterventionSignal } from '../types/interventionSignal.types'
import type {
  AgriculturalObservationSource,
  AgriculturalYieldReference,
} from '../../../types/data-contract'
import { calculateInterventionSignal } from '../utils/calculateInterventionSignal'
import {
  getAgriculturalObservations,
  getNationalMaizeYieldReference,
} from './agriculturalData'

export interface DistrictInsight {
  district: string
  crop: string
  source: AgriculturalObservationSource
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
}

function formatTonnes(value: number): string {
  return `${value.toLocaleString()} tonnes`
}

function formatArea(value: number): string {
  return `${value.toLocaleString()} ha`
}

function formatYield(value: number): string {
  return `${(value / 1000).toFixed(2)} t/ha`
}

function createInsight(district: string, yieldGapPct: number): string {
  if (yieldGapPct <= -20) {
    return `Maize yield is ${Math.abs(yieldGapPct).toFixed(1)}% below the national reference, indicating a significant productivity gap that warrants further investigation.`
  }

  if (yieldGapPct <= -10) {
    return `Maize yield is ${Math.abs(yieldGapPct).toFixed(1)}% below the national reference, indicating a moderate productivity gap.`
  }

  if (yieldGapPct >= 10) {
    return `Maize yield is ${yieldGapPct.toFixed(1)}% above the national reference, providing a useful productivity reference for comparison.`
  }

  return `Maize yield in ${district} is close to the national reference for Season A 2024/25.`
}

const nationalYieldReference = getNationalMaizeYieldReference()

const districtInsights: DistrictInsight[] = getAgriculturalObservations().map(
  (observation) => {
    const interventionSignal = calculateInterventionSignal({
      yield: observation.yieldKilogramsPerHectare,
      referenceYield: nationalYieldReference.value,
    })
    const yieldGapPct = interventionSignal.yieldGapPct

    return {
      district: observation.district,
      crop: observation.crop,
      season: `Season ${observation.season}`,
      year: observation.agriculturalYear,
      source: observation.source,
      nationalYieldReference,
      insight: createInsight(observation.district, yieldGapPct),
      evidenceLabel: 'View evidence',
      totalProduction: formatTonnes(observation.productionTonnes),
      cultivatedArea: formatArea(observation.cultivatedAreaHectares),
      averageYield: formatYield(observation.yieldKilogramsPerHectare),
      inputUse: 'Not yet available',
      yieldGapPct,
      interventionSignal,
    }
  },
)

export { districtInsights }

const defaultInterventionSignal = calculateInterventionSignal({
  yield: nationalYieldReference.value,
  referenceYield: nationalYieldReference.value,
})

const defaultInsight: DistrictInsight = {
  district: 'Rwanda',
  crop: 'Maize',
  source: {
    kind: 'mock',
    dataset: 'Mock national maize summary',
  },
  nationalYieldReference,
  season: 'Season A',
  year: '2024/25',
  insight:
    'Select a district on the map to see district-specific maize productivity evidence and intervention signals.',
  evidenceLabel: 'View evidence',
  totalProduction: '481,246 tonnes',
  cultivatedArea: '244,095 ha',
  averageYield: formatYield(nationalYieldReference.value),
  inputUse: 'Not yet available',
  yieldGapPct: 0,
  interventionSignal: defaultInterventionSignal,
}

export function getDistrictInsight(districtName?: string): DistrictInsight {
  if (!districtName) {
    return defaultInsight
  }

  return (
    districtInsights.find(
      (district) =>
        district.district.toLowerCase() === districtName.toLowerCase(),
    ) ?? {
      ...defaultInsight,
      district: districtName,
      insight: `Maize productivity data for ${districtName} is not available in the current development dataset.`,
    }
  )
}
