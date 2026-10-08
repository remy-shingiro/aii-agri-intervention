import { describe, expect, it } from 'vitest'

import type { AgriculturalSeason } from '../../types/data-contract'
import type { EvidenceRecord } from '../evidence/types/evidence.types'
import { calculateAgriculturalSignals } from './agriculturalSignalEngine'
import { calculateNationalIntelligence } from './nationalIntelligence'

const yieldTable = 'Table 19: fixture district yield'
const irrigationTable = 'Table 64: fixture irrigation practice'
const scope = { crop: 'maize', season: 'A' as const, year: '2024-25' }

function createRecord({
  id,
  indicator = 'average_yield',
  district,
  geographyLevel = 'district',
  crop = 'Maize',
  year = '2024/25',
  season = 'A',
  value,
  unit = 'Kg/Ha',
  status = 'observed',
  dataset = 'SAS 2025',
  table = yieldTable,
  referenceEvidenceId,
  referenceValue,
}: {
  id: string
  indicator?: EvidenceRecord['indicator']
  district: string
  geographyLevel?: EvidenceRecord['geography']['level']
  crop?: string
  year?: string
  season?: AgriculturalSeason
  value: number | null
  unit?: string
  status?: EvidenceRecord['status']
  dataset?: string
  table?: string
  referenceEvidenceId?: string
  referenceValue?: number
}): EvidenceRecord {
  return {
    id,
    indicator,
    label: indicator,
    ...(indicator === 'irrigation_practice' ? {} : { crop }),
    value,
    unit,
    geography: {
      level: geographyLevel,
      id: geographyLevel === 'national' ? 'rwanda' : district,
      name: geographyLevel === 'national' ? 'Rwanda' : district,
    },
    period: { year, season },
    dataset,
    source: {
      kind: 'nisr',
      dataset,
      report: `${dataset} fixture report`,
      reportYear: dataset === 'SAS 2024' ? 2024 : 2025,
      sourceUrl: `https://example.test/${dataset.toLowerCase().replaceAll(' ', '-')}.pdf`,
      references: [{ table }],
    },
    sourceReference: { table },
    status,
    ...(referenceEvidenceId ? { referenceEvidenceId } : {}),
    ...(referenceValue !== undefined ? { referenceValue } : {}),
  }
}

function nationalYield(value = 100): EvidenceRecord {
  return createRecord({
    id: 'fixture-rwanda-maize-yield',
    district: 'Rwanda',
    geographyLevel: 'national',
    value,
  })
}

function districtYield(
  district: string,
  value: number | null,
  overrides: Partial<Parameters<typeof createRecord>[0]> = {},
): EvidenceRecord {
  return createRecord({
    id: `fixture-${district.toLowerCase()}-${overrides.year ?? '2024/25'}-${overrides.crop ?? 'maize'}-yield`,
    district,
    value,
    referenceEvidenceId: 'fixture-rwanda-maize-yield',
    referenceValue: 100,
    ...overrides,
  })
}

function irrigationPractice(
  district: string,
  value: number,
  isNational = false,
): EvidenceRecord {
  return createRecord({
    id: isNational
      ? 'fixture-rwanda-irrigation'
      : `fixture-${district.toLowerCase()}-irrigation`,
    indicator: 'irrigation_practice',
    district,
    geographyLevel: isNational ? 'national' : 'district',
    value,
    unit: '%',
    table: irrigationTable,
    ...(isNational
      ? {}
      : {
          referenceEvidenceId: 'fixture-rwanda-irrigation',
          referenceValue: 10,
        }),
  })
}

function normalRecords(): readonly EvidenceRecord[] {
  const national = nationalYield()
  const districts = [
    { district: 'Alpha', historical: 60, current: 80, irrigation: 5 },
    { district: 'Beta', historical: 140, current: 120, irrigation: 15 },
    { district: 'Gamma', historical: 100, current: 100, irrigation: 5 },
  ]

  return [
    national,
    irrigationPractice('Rwanda', 10, true),
    ...districts.flatMap(({ district, historical, current, irrigation }) => [
      districtYield(district, historical, {
        id: `fixture-${district.toLowerCase()}-2023/24-yield`,
        year: '2023/24',
        dataset: 'SAS 2024',
        table: 'Table 16: fixture historical yield',
        referenceEvidenceId: undefined,
        referenceValue: undefined,
      }),
      districtYield(district, current),
      irrigationPractice(district, irrigation),
    ]),
  ]
}

describe('national agricultural intelligence aggregation', () => {
  it('aggregates the existing engine results across distinct districts', () => {
    const summary = calculateNationalIntelligence(normalRecords(), scope)

    expect(summary).toMatchObject({
      districtsInScope: 3,
      observedYieldDistrictCount: 3,
      districtsAnalyzed: 3,
      insufficientEvidenceCount: 0,
      productivityGapCount: 1,
      improvingDistrictCount: 1,
      decliningDistrictCount: 1,
      stableDistrictCount: 1,
      trendInsufficientEvidenceCount: 0,
      irrigationEvaluatedDistrictCount: 3,
      irrigationInsufficientEvidenceCount: 0,
      irrigationInvestigationCount: 1,
      districtsBySignal: {
        comparableYield: ['Alpha', 'Beta', 'Gamma'],
        productivityGap: ['Alpha'],
        improving: ['Alpha'],
        declining: ['Beta'],
        stable: ['Gamma'],
        irrigationInvestigation: ['Alpha'],
      },
    })
    expect(summary.sourceReferences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataset: 'SAS 2025', table: yieldTable }),
        expect.objectContaining({ dataset: 'SAS 2025', table: irrigationTable }),
        expect.objectContaining({
          dataset: 'SAS 2024',
          table: 'Table 16: fixture historical yield',
        }),
      ]),
    )
  })

  it('returns an empty summary when there are no matching records', () => {
    const empty = calculateNationalIntelligence([], scope)
    const unsupportedSeason = calculateNationalIntelligence(normalRecords(), {
      ...scope,
      season: undefined,
    })

    expect(empty.districtsInScope).toBe(0)
    expect(empty.observedYieldDistrictCount).toBe(0)
    expect(empty.districtsAnalyzed).toBe(0)
    expect(empty.insufficientEvidenceCount).toBe(0)
    expect(empty.sourceReferences).toEqual([])
    expect(unsupportedSeason).toEqual(empty)
  })

  it('keeps unavailable yield evidence distinct from zero and insufficient', () => {
    const records = [
      nationalYield(),
      districtYield('Unavailable District', null, { status: 'unavailable' }),
    ]
    const summary = calculateNationalIntelligence(records, scope)

    expect(summary.districtsInScope).toBe(1)
    expect(summary.observedYieldDistrictCount).toBe(0)
    expect(summary.districtsAnalyzed).toBe(0)
    expect(summary.insufficientEvidenceCount).toBe(1)
    expect(summary.productivityGapCount).toBe(0)
    expect(summary.districtsBySignal.insufficientYield).toEqual([
      'Unavailable District',
    ])
  })

  it('does not combine yield evidence from another year or season', () => {
    const wrongPeriodReference = createRecord({
      id: 'fixture-wrong-period-national-yield',
      district: 'Rwanda',
      geographyLevel: 'national',
      year: '2023/24',
      value: 100,
    })
    const targetYield = districtYield('Target District', 80, {
      referenceEvidenceId: wrongPeriodReference.id,
    })
    const outOfPeriodYield = districtYield('Other District', 80, {
      year: '2023/24',
      season: 'B',
      referenceEvidenceId: undefined,
      referenceValue: undefined,
    })
    const summary = calculateNationalIntelligence(
      [wrongPeriodReference, targetYield, outOfPeriodYield],
      scope,
    )

    expect(summary.districtsInScope).toBe(1)
    expect(summary.observedYieldDistrictCount).toBe(1)
    expect(summary.districtsAnalyzed).toBe(0)
    expect(summary.insufficientEvidenceCount).toBe(1)
    expect(summary.districtsBySignal.insufficientYield).toEqual([
      'Target District',
    ])
  })

  it('does not include another crop in the district universe or signal counts', () => {
    const records = [
      nationalYield(),
      districtYield('Maize District', 80),
      districtYield('Beans District', 10, {
        crop: 'Beans',
        referenceEvidenceId: undefined,
        referenceValue: undefined,
      }),
    ]
    const summary = calculateNationalIntelligence(records, scope)

    expect(summary.districtsInScope).toBe(1)
    expect(summary.districtsAnalyzed).toBe(1)
    expect(summary.productivityGapCount).toBe(1)
    expect(summary.districtsBySignal.comparableYield).toEqual([
      'Maize District',
    ])
  })

  it('does not inflate district counts when input records contain duplicates', () => {
    const duplicate = districtYield('Alpha', 80)
    const summary = calculateNationalIntelligence(
      [nationalYield(), duplicate, duplicate],
      scope,
    )

    expect(summary.districtsInScope).toBe(1)
    expect(summary.districtsAnalyzed).toBe(0)
    expect(summary.insufficientEvidenceCount).toBe(1)
  })

  it('reports the current engine output without reimplementing signal rules', () => {
    const records = normalRecords()
    const engineSignals = calculateAgriculturalSignals(records, {
      district: 'Alpha',
      crop: 'maize',
      year: '2024/25',
      season: 'A',
    })
    const summary = calculateNationalIntelligence(records, scope)

    expect(summary.productivityGapCount).toBe(
      engineSignals[0].status === 'below_reference' ? 1 : 0,
    )
    expect(summary.improvingDistrictCount).toBe(
      engineSignals[1].status === 'improving' ? 1 : 0,
    )
    expect(summary.irrigationInvestigationCount).toBe(
      engineSignals[2].status === 'supported' ? 1 : 0,
    )
  })
})
