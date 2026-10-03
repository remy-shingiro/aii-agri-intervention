import type { DistrictEvidence } from '../types/districtEvidence.types'

export const districtEvidence: DistrictEvidence[] = [
  {
    district: 'Gatsibo',
    improvedSeedUsePct: 42,
    fertilizerUsePct: 56,
    irrigationUsePct: 18,
    extensionAccessPct: 61,
    soilManagementPct: 48,
    mechanizationUsePct: 9,
  },
  {
    district: 'Nyagatare',
    improvedSeedUsePct: 51,
    fertilizerUsePct: 63,
    irrigationUsePct: 24,
    extensionAccessPct: 68,
    soilManagementPct: 55,
    mechanizationUsePct: 12,
  },
  {
    district: 'Kayonza',
    improvedSeedUsePct: 47,
    fertilizerUsePct: 59,
    irrigationUsePct: 31,
    extensionAccessPct: 64,
    soilManagementPct: 52,
    mechanizationUsePct: 11,
  },
  {
    district: 'Musanze',
    improvedSeedUsePct: 64,
    fertilizerUsePct: 71,
    irrigationUsePct: 14,
    extensionAccessPct: 76,
    soilManagementPct: 69,
    mechanizationUsePct: 7,
  },
  {
    district: 'Huye',
    improvedSeedUsePct: 58,
    fertilizerUsePct: 66,
    irrigationUsePct: 21,
    extensionAccessPct: 73,
    soilManagementPct: 62,
    mechanizationUsePct: 8,
  },
  {
    district: 'Rubavu',
    improvedSeedUsePct: 62,
    fertilizerUsePct: 69,
    irrigationUsePct: 17,
    extensionAccessPct: 71,
    soilManagementPct: 59,
    mechanizationUsePct: 6,
  },
]

export function getDistrictEvidence(
  districtName?: string,
): DistrictEvidence | undefined {
  if (!districtName) {
    return undefined
  }

  return districtEvidence.find(
    (evidence) =>
      evidence.district.toLowerCase() ===
      districtName.toLowerCase(),
  )
}
