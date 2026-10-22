import { describe, expect, it } from 'vitest'

import { districtMetadata } from '../../district-profile/data/districtMetadata'
import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import { buildDistrictInvestigationBrief } from './districtInvestigationBrief'

describe('district investigation brief preparation', () => {
  it('reuses current-period evidence and derived comparisons for Nyarugenge', () => {
    const brief = buildDistrictInvestigationBrief(
      'Nyarugenge',
      'maize',
      '2024-25',
      'A',
    )

    expect(brief).toBeDefined()
    expect(brief?.signals[0]).toMatchObject({
      signalType: 'productivity_gap',
      status: 'below_reference',
      districtYield: 1338,
      nationalYield: 1985,
      absoluteGap: -647,
    })
    expect(brief?.signals[1]).toMatchObject({
      signalType: 'productivity_trend',
      status: 'declining',
      periodsUsed: ['2023/24', '2024/25'],
      netChange: -52,
    })
    expect(brief?.irrigationTrail).toMatchObject({
      status: 'available',
      irrigationDifference: -4.9,
      yieldDifference: -647,
    })
    expect(brief?.records.map((record) => record.id)).toEqual(
      expect.arrayContaining([
        'sas-2025-season-a-nyarugenge-average_yield',
        'sas-2025-season-a-rwanda-average_yield',
        'sas-2025-season-a-nyarugenge-irrigation_practice',
        'sas-2025-season-a-rwanda-irrigation_practice',
        'sas-2025-season-a-nyarugenge-crop_production',
        'sas-2025-season-a-nyarugenge-cultivated_area',
      ]),
    )
    const irrigationRecord = brief?.records.find(
      (record) => record.indicator === 'irrigation_practice',
    )
    expect(irrigationRecord?.crop).toBeUndefined()
    expect(irrigationRecord?.unit).toBe('%')
    expect(brief?.questions.length).toBeGreaterThan(0)
  })

  it('updates observations and signal status for a different supported district', () => {
    const brief = buildDistrictInvestigationBrief(
      'Gasabo',
      'maize',
      '2024/25',
      'A',
    )

    expect(brief?.district).toBe('Gasabo')
    expect(brief?.signals[0]).toMatchObject({
      status: 'below_reference',
      districtYield: 1582,
    })
    expect(brief?.signals[2]).toMatchObject({ status: 'conditions_not_met' })
    expect(
      brief?.records.some((record) => record.id.includes('nyarugenge')),
    ).toBe(false)
    expect(
      brief?.records.every(
        (record) =>
          record.geography.level === 'national' ||
          record.geography.name === 'Gasabo',
      ),
    ).toBe(true)
  })

  it('shows candidate records and the ambiguity reason when a match is not unique', () => {
    const districtYield = evidenceRecords.find(
      (record) => record.id === 'sas-2025-season-a-nyarugenge-average_yield',
    )
    expect(districtYield).toBeDefined()
    if (!districtYield) return

    const duplicate = {
      ...districtYield,
      id: 'fixture-duplicate-nyarugenge-yield',
    }
    const brief = buildDistrictInvestigationBrief(
      'Nyarugenge',
      'maize',
      '2024/25',
      'A',
      [...evidenceRecords, duplicate],
    )

    expect(brief?.signals[0].status).toBe('insufficient_evidence')
    expect(brief?.signals[0].rationale).toContain(
      'More than one district yield record matches this selection; the comparison is ambiguous.',
    )
    expect(brief?.records.map((record) => record.id)).toContain(
      'fixture-duplicate-nyarugenge-yield',
    )
  })

  it('keeps every supported district visible when the selected period has no connected evidence', () => {
    for (const { district } of districtMetadata) {
      const brief = buildDistrictInvestigationBrief(
        district,
        'maize',
        '2019/20',
        'A',
      )
      expect(brief?.district).toBe(district)
      expect(brief?.signals).toHaveLength(3)
      expect(brief?.signals[0].status).toBe('insufficient_evidence')
      expect(brief?.signals[2].status).toBe('insufficient_evidence')
      expect(
        brief?.records.every(
          (record) =>
            record.geography.level === 'national' ||
            record.geography.name === district,
        ),
      ).toBe(true)
      expect(brief?.questions.length).toBeGreaterThan(0)
    }
  })

  it('returns no brief when no district is selected and does not expand province evidence', () => {
    expect(
      buildDistrictInvestigationBrief(undefined, 'maize', '2024/25', 'A'),
    ).toBeUndefined()

    const brief = buildDistrictInvestigationBrief(
      'Nyarugenge',
      'maize',
      '2024/25',
      'A',
      evidenceRecords,
    )
    expect(
      brief?.records.some((record) => record.geography.level === 'province'),
    ).toBe(false)
  })
})
