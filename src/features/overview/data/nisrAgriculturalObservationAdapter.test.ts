import { describe, expect, it } from 'vitest'

import type { NisrAgriculturalSourceDataset } from './nisrAgriculturalObservationAdapter'
import { adaptNisrAgriculturalObservations } from './nisrAgriculturalObservationAdapter'
import { nisrMaizeSas2025Source } from './nisrMaizeSas2025Source'

describe('NISR agricultural observation adapter', () => {
  it('maps district maize rows with season, year, geography, and provenance', () => {
    const observations = adaptNisrAgriculturalObservations(
      nisrMaizeSas2025Source,
    )

    expect(observations).toHaveLength(30)
    expect(observations[0]).toMatchObject({
      geographyLevel: 'district',
      district: 'Nyarugenge',
      crop: 'Maize',
      season: 'A',
      agriculturalYear: '2024/25',
      source: {
        kind: 'nisr',
        dataset: 'SAS 2025',
        report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
        reportYear: 2025,
        sourceUrl:
          'https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf',
        references: [{ page: 50 }, { page: 56 }, { page: 61 }],
      },
    })

    expect(
      observations.find(({ district }) => district === 'Nyagatare'),
    ).toMatchObject({
      geographyLevel: 'district',
      productionTonnes: 85407,
      cultivatedAreaHectares: 30096,
      yieldKilogramsPerHectare: 2834,
    })
  })

  it('preserves the source units without conversion', () => {
    const observation = adaptNisrAgriculturalObservations(
      nisrMaizeSas2025Source,
    )[0]

    expect(observation).toMatchObject({
      productionTonnes: 909,
      cultivatedAreaHectares: 679,
      yieldKilogramsPerHectare: 1338,
    })
  })

  it('rejects unsupported units and excludes unsupported or invalid rows', () => {
    const unsupportedUnits: NisrAgriculturalSourceDataset = {
      ...nisrMaizeSas2025Source,
      productionUnit: 'kg',
    }
    expect(adaptNisrAgriculturalObservations(unsupportedUnits)).toEqual([])

    expect(
      adaptNisrAgriculturalObservations({
        ...nisrMaizeSas2025Source,
        crop: 'Beans',
      }),
    ).toEqual([])

    const recordsWithInvalidRows: NisrAgriculturalSourceDataset = {
      ...nisrMaizeSas2025Source,
      records: [
        nisrMaizeSas2025Source.records[0],
        {
          ...nisrMaizeSas2025Source.records[1],
          geographyLevel: 'province',
        },
        { ...nisrMaizeSas2025Source.records[2], geographyName: ' ' },
        { ...nisrMaizeSas2025Source.records[2], geographyName: ' Huye' },
        { ...nisrMaizeSas2025Source.records[3], cultivatedArea: -1 },
        { ...nisrMaizeSas2025Source.records[4], yield: Number.NaN },
      ],
    }
    expect(
      adaptNisrAgriculturalObservations(recordsWithInvalidRows),
    ).toHaveLength(1)
  })

  it('does not mutate source records or provenance references', () => {
    const originalRecords = nisrMaizeSas2025Source.records.map((record) => ({
      ...record,
    }))
    const originalReferences = nisrMaizeSas2025Source.source.references.map(
      (reference) => ({ ...reference }),
    )

    const observations = adaptNisrAgriculturalObservations(
      nisrMaizeSas2025Source,
    )

    expect(nisrMaizeSas2025Source.records).toEqual(originalRecords)
    expect(nisrMaizeSas2025Source.source.references).toEqual(originalReferences)
    expect(observations[0]).not.toBe(nisrMaizeSas2025Source.records[0])
  })
})
