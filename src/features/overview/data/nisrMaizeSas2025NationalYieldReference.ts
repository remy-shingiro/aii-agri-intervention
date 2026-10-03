import type { AgriculturalYieldReference } from '../../../types/data-contract'

/** National row from NISR SAS 2025 Annual Report Table 19. */
export const nisrMaizeSas2025NationalYieldReference = {
  value: 1985,
  unit: 'Kg/Ha',
  crop: 'Maize',
  season: 'A',
  agriculturalYear: '2024/25',
  geographyLevel: 'national',
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
          'Table 19: 2025 Season A_Average yield by crop type and district (Kg/Ha)',
        page: 56,
      },
    ],
  },
} as const satisfies AgriculturalYieldReference
