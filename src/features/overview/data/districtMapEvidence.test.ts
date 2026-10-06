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

  it('does not carry evidence into a different year or season', () => {
    const lookup = createDistrictMapEvidenceLookup(evidenceRecords, {
      crop: 'Maize',
      year: '2023/24',
      season: 'B',
    })

    expect(lookup.get('kayonza')).toBeUndefined()
  })

  it('does not show maize yield under another crop filter', () => {
    const lookup = createDistrictMapEvidenceLookup(evidenceRecords, {
      crop: 'Beans',
      year: '2024/25',
      season: 'A',
    })

    const summary = lookup.get('kayonza')

    expect(summary?.districtYield).toBeUndefined()
    expect(summary?.nationalYield).toBeUndefined()
    expect(summary?.districtIrrigation?.value).toBe(16.1)
    expect(summary?.nationalIrrigation?.value).toBe(13.4)
  })
})
