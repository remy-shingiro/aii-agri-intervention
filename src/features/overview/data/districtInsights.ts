import {
  MAIZE_NATIONAL_YIELD_KG_PER_HA,
  maizeObservations,
} from './maizeObservations'

export interface DistrictInsight {
  district: string
  crop: string
  season: string
  year: string
  insight: string
  evidenceLabel: string
  totalProduction: string
  cultivatedArea: string
  averageYield: string
  inputUse: string
  yieldGapPct: number
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

function calculateYieldGapPct(yieldKgPerHa: number): number {
  return (
    ((yieldKgPerHa - MAIZE_NATIONAL_YIELD_KG_PER_HA) /
      MAIZE_NATIONAL_YIELD_KG_PER_HA) *
    100
  )
}

function createInsight(
  district: string,
  yieldGapPct: number,
): string {
  if (yieldGapPct <= -20) {
    return `Maize yield is ${Math.abs(yieldGapPct).toFixed(1)}% below the national reference, indicating a significant productivity gap that warrants further investigation.`
  }

  if (yieldGapPct < -10) {
    return `Maize yield is ${Math.abs(yieldGapPct).toFixed(1)}% below the national reference, indicating a moderate productivity gap.`
  }

  if (yieldGapPct >= 10) {
    return `Maize yield is ${yieldGapPct.toFixed(1)}% above the national reference, providing a useful productivity reference for comparison.`
  }

  return `Maize yield in ${district} is close to the national reference for Season A 2024/25.`
}

const districtInsights: DistrictInsight[] = maizeObservations.map(
  (observation) => {
    const yieldGapPct = calculateYieldGapPct(
      observation.yieldKgPerHa,
    )

    return {
      district: observation.district,
      crop: 'Maize',
      season: 'Season A',
      year: '2024/25',
      insight: createInsight(
        observation.district,
        yieldGapPct,
      ),
      evidenceLabel: 'View evidence',
      totalProduction: formatTonnes(
        observation.productionTonnes,
      ),
      cultivatedArea: formatArea(
        observation.cultivatedAreaHa,
      ),
      averageYield: formatYield(
        observation.yieldKgPerHa,
      ),
      inputUse: 'Not yet available',
      yieldGapPct,
    }
  },
)

export { districtInsights }

const defaultInsight: DistrictInsight = {
  district: 'Rwanda',
  crop: 'Maize',
  season: 'Season A',
  year: '2024/25',
  insight:
    'Select a district on the map to see district-specific maize productivity evidence and intervention signals.',
  evidenceLabel: 'View evidence',
  totalProduction: '481,246 tonnes',
  cultivatedArea: '244,095 ha',
  averageYield: '1.99 t/ha',
  inputUse: 'Not yet available',
  yieldGapPct: 0,
}

export function getDistrictInsight(
  districtName?: string,
): DistrictInsight {
  if (!districtName) {
    return defaultInsight
  }

  return (
    districtInsights.find(
      (district) =>
        district.district.toLowerCase() ===
        districtName.toLowerCase(),
    ) ?? {
      ...defaultInsight,
      district: districtName,
      insight: `NISR maize productivity data for ${districtName} is not available in the current dataset.`,
    }
  )
}
