import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import { createDistrictMapEvidenceLookup } from './districtMapEvidence'

describe('district map evidence lookup', () => {
  it('returns the connected same-period yield and irrigation values', () => {
    const lookup = createDistrictMapEvidenceLookup(evidenceRecords, {
      crop: 'Maize',
      year: '2024/25',
      season: 'A',
    })

    expect(lookup.get('kayonza')).toMatchObject({
      districtYield: { value: 1925 },
      nationalYield: { value: 1985 },
      districtIrrigation: { value: 16.1 },
      nationalIrrigation: { value: 13.4 },
    })
  })

  it('returns the source-backed SAS 2024 observation for its selected period', () => {
    const lookup = createDistrictMapEvidenceLookup(evidenceRecords, {
      crop: 'Maize',
      year: '2023/24',
      season: 'B',
    })

    expect(lookup.get('kayonza')).toMatchObject({
      districtYield: {
        dataset: 'SAS 2024',
        value: 1183,
        period: { year: '2023/24', season: 'B' },
      },
      nationalYield: {
        dataset: 'SAS 2024',
        value: 1284,
      },
      districtIrrigation: { dataset: 'SAS 2024', value: 13.1 },
      nationalIrrigation: { dataset: 'SAS 2024', value: 12.1 },
    })
  })

  it('uses the selected crop while keeping irrigation practice crop independent', () => {
    const lookup = createDistrictMapEvidenceLookup(evidenceRecords, {
      crop: 'Beans',
      year: '2024/25',
      season: 'A',
    })

    const summary = lookup.get('kayonza')

    expect(summary?.districtYield).toMatchObject({
      crop: 'Beans',
      value: 684,
    })
    expect(summary?.nationalYield).toMatchObject({
      crop: 'Beans',
      value: 705,
    })
    expect(summary?.districtIrrigation?.value).toBe(16.1)
    expect(summary?.nationalIrrigation?.value).toBe(13.4)
  })
})
