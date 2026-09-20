
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
}

export const districtInsights: DistrictInsight[] = [
  {
    district: 'Gasabo',
    crop: 'Maize',
    season: 'Season A',
    year: '2024/25',
    insight:
      'Maize productivity is below the national reference, suggesting this district should be examined for input-use and production constraints.',
    evidenceLabel: 'View evidence',
    totalProduction: '1.2M tonnes',
    cultivatedArea: '620K ha',
    averageYield: '1.9 t/ha',
    inputUse: '68%',
  },
  {
    district: 'Musanze',
    crop: 'Maize',
    season: 'Season A',
    year: '2024/25',
    insight:
      'Musanze shows relatively strong maize productivity, providing a useful reference when comparing intervention needs across districts.',
    evidenceLabel: 'View evidence',
    totalProduction: '1.2M tonnes',
    cultivatedArea: '620K ha',
    averageYield: '2.4 t/ha',
    inputUse: '74%',
  },
  {
    district: 'Nyagatare',
    crop: 'Maize',
    season: 'Season A',
    year: '2024/25',
    insight:
      'Production is substantial, but yield performance indicates an opportunity to investigate whether input access is translating into productivity gains.',
    evidenceLabel: 'View evidence',
    totalProduction: '1.2M tonnes',
    cultivatedArea: '620K ha',
    averageYield: '1.7 t/ha',
    inputUse: '63%',
  },
]

const defaultInsight: DistrictInsight = {
  district: 'Rwanda',
  crop: 'Maize',
  season: 'Season A',
  year: '2024/25',
  insight:
    'Select a district on the map to see district-specific agricultural evidence and intervention signals.',
  evidenceLabel: 'View evidence',
  totalProduction: '1.2M tonnes',
  cultivatedArea: '620K ha',
  averageYield: '1.9 t/ha',
  inputUse: '68%',
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
        district.district.toLowerCase() === districtName.toLowerCase(),
    ) ?? {
      ...defaultInsight,
      district: districtName,
      insight: `Agricultural evidence for ${districtName} will appear here as the district data is connected.`,
    }
  )
}