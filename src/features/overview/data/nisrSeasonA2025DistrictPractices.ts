import type { AgriculturalObservationSource } from '../../../types/data-contract'

export interface DistrictPracticeObservation {
  readonly district: string
  readonly irrigationPracticePct: number
}

export interface DistrictPracticeDataset {
  readonly season: 'A'
  readonly agriculturalYear: '2024/25'
  readonly indicator: 'Farmers who practiced irrigation'
  readonly unit: '%'
  readonly nationalReference: number
  readonly source: Extract<
    AgriculturalObservationSource,
    { readonly kind: 'nisr' }
  >
  readonly records: readonly DistrictPracticeObservation[]
}

/** Overall district estimates transcribed from NISR SAS 2025 Table 64. */
export const nisrSeasonA2025DistrictPractices = {
  season: 'A',
  agriculturalYear: '2024/25',
  indicator: 'Farmers who practiced irrigation',
  unit: '%',
  nationalReference: 13.4,
  source: {
    kind: 'nisr',
    dataset: 'SAS 2025',
    report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
    reportYear: 2025,
    sourceUrl:
      'https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf',
    references: [
      {
        table:
          'Table 64: 2025 Season A Percentage of farmers who practiced agricultural practices',
      },
    ],
  },
  records: [
    { district: 'Nyarugenge', irrigationPracticePct: 8.5 },
    { district: 'Gasabo', irrigationPracticePct: 28.6 },
    { district: 'Kicukiro', irrigationPracticePct: 11.5 },
    { district: 'Nyanza', irrigationPracticePct: 9.1 },
    { district: 'Gisagara', irrigationPracticePct: 26.9 },
    { district: 'Nyaruguru', irrigationPracticePct: 19.4 },
    { district: 'Huye', irrigationPracticePct: 26.2 },
    { district: 'Nyamagabe', irrigationPracticePct: 11.5 },
    { district: 'Ruhango', irrigationPracticePct: 15.0 },
    { district: 'Muhanga', irrigationPracticePct: 13.5 },
    { district: 'Kamonyi', irrigationPracticePct: 25.3 },
    { district: 'Karongi', irrigationPracticePct: 11.8 },
    { district: 'Rutsiro', irrigationPracticePct: 4.8 },
    { district: 'Rubavu', irrigationPracticePct: 1.1 },
    { district: 'Nyabihu', irrigationPracticePct: 1.7 },
    { district: 'Ngororero', irrigationPracticePct: 7.8 },
    { district: 'Rusizi', irrigationPracticePct: 12.0 },
    { district: 'Nyamasheke', irrigationPracticePct: 15.2 },
    { district: 'Rulindo', irrigationPracticePct: 34.5 },
    { district: 'Gakenke', irrigationPracticePct: 8.7 },
    { district: 'Musanze', irrigationPracticePct: 7.8 },
    { district: 'Burera', irrigationPracticePct: 3.9 },
    { district: 'Gicumbi', irrigationPracticePct: 10.2 },
    { district: 'Rwamagana', irrigationPracticePct: 17.2 },
    { district: 'Nyagatare', irrigationPracticePct: 15.3 },
    { district: 'Gatsibo', irrigationPracticePct: 13.0 },
    { district: 'Kayonza', irrigationPracticePct: 16.1 },
    { district: 'Kirehe', irrigationPracticePct: 9.9 },
    { district: 'Ngoma', irrigationPracticePct: 11.8 },
    { district: 'Bugesera', irrigationPracticePct: 12.0 },
  ],
} as const satisfies DistrictPracticeDataset
