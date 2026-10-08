import type { AgriculturalSeason } from '../../types/data-contract'
import type {
  AgriculturalSignal,
  AgriculturalSignalPeriod,
  AgriculturalSignalType,
  IrrigationInvestigationSignal,
  ProductivityGapSignal,
  ProductivityTrendSignal,
} from '../../types/agricultural-signal'
import type { EvidenceRecord } from '../evidence/types/evidence.types'

export interface AgriculturalSignalContext {
  readonly district: string
  readonly crop: string
  readonly year: string
  readonly season: AgriculturalSeason
}

type SignalBuilder = (
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
) => AgriculturalSignal

const limitations = [
  'This signal describes the connected NISR evidence only. It does not establish causality or guarantee an intervention outcome.',
] as const

interface EvidenceIndex {
  readonly recordsById: ReadonlyMap<string, EvidenceRecord>
  readonly districtRecordsByGeography: ReadonlyMap<string, readonly EvidenceRecord[]>
  readonly nationalRecordsByGeography: ReadonlyMap<string, readonly EvidenceRecord[]>
  readonly districtYieldsByDimensions: ReadonlyMap<string, readonly EvidenceRecord[]>
  readonly derivedGapsBySourcePair: ReadonlyMap<string, readonly EvidenceRecord[]>
}

const evidenceIndexes = new WeakMap<readonly EvidenceRecord[], EvidenceIndex>()

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeYear(value: string): string {
  return value.replace('-', '/')
}

function normalizeDistrict(value: string): string {
  return normalize(value).replace(/[\s_]+/g, '-')
}

function indexKey(values: readonly string[]): string {
  return JSON.stringify(values.map(normalize))
}

function appendToIndex(
  index: Map<string, EvidenceRecord[]>,
  key: string,
  record: EvidenceRecord,
): void {
  const group = index.get(key) ?? []
  group.push(record)
  index.set(key, group)
}

function sourcePairKey(ids: readonly string[]): string {
  return JSON.stringify([...ids].sort())
}

function createEvidenceIndex(records: readonly EvidenceRecord[]): EvidenceIndex {
  const recordsById = new Map<string, EvidenceRecord>()
  const districtRecordsByGeography = new Map<string, EvidenceRecord[]>()
  const nationalRecordsByGeography = new Map<string, EvidenceRecord[]>()
  const districtYieldsByDimensions = new Map<string, EvidenceRecord[]>()
  const derivedGapsBySourcePair = new Map<string, EvidenceRecord[]>()

  for (const record of records) {
    recordsById.set(record.id, record)

    if (record.derivedFromEvidenceIds?.length === 2) {
      appendToIndex(
        derivedGapsBySourcePair,
        sourcePairKey(record.derivedFromEvidenceIds),
        record,
      )
    }

    if (!hasNisrProvenance(record)) continue

    if (record.geography.level === 'district') {
      const geographyKeys = new Set([
        normalizeDistrict(record.geography.name),
        normalizeDistrict(record.geography.id),
      ])
      for (const geographyKey of geographyKeys) {
        appendToIndex(districtRecordsByGeography, geographyKey, record)
      }
      if (record.indicator === 'average_yield' && record.period.season) {
        appendToIndex(
          districtYieldsByDimensions,
          indexKey([
            normalizeDistrict(record.geography.name),
            record.crop ?? '',
            record.period.season,
          ]),
          record,
        )
        if (normalizeDistrict(record.geography.id) !== normalizeDistrict(record.geography.name)) {
          appendToIndex(
            districtYieldsByDimensions,
            indexKey([
              normalizeDistrict(record.geography.id),
              record.crop ?? '',
              record.period.season,
            ]),
            record,
          )
        }
      }
    } else if (record.geography.level === 'national') {
      appendToIndex(
        nationalRecordsByGeography,
        normalizeDistrict(record.geography.id),
        record,
      )
    }
  }

  return {
    recordsById,
    districtRecordsByGeography,
    nationalRecordsByGeography,
    districtYieldsByDimensions,
    derivedGapsBySourcePair,
  }
}

function getEvidenceIndex(records: readonly EvidenceRecord[]): EvidenceIndex {
  const cached = evidenceIndexes.get(records)
  if (cached) return cached
  const index = createEvidenceIndex(records)
  evidenceIndexes.set(records, index)
  return index
}

function isDistrict(record: EvidenceRecord, district: string): boolean {
  return (
    record.geography.level === 'district' &&
    (normalizeDistrict(record.geography.id) === normalizeDistrict(district) ||
      normalize(record.geography.name) === normalize(district))
  )
}

function hasNisrProvenance(record: EvidenceRecord): boolean {
  if (record.source.kind !== 'nisr') return false

  const source = record.source
  const sourceReference = record.sourceReference
  const references = source.references
  if (
    typeof source.report !== 'string' ||
    typeof source.dataset !== 'string' ||
    typeof source.sourceUrl !== 'string' ||
    typeof sourceReference?.table !== 'string' ||
    !Array.isArray(references)
  ) {
    return false
  }

  const pageIsValid =
    sourceReference.page === undefined ||
    (Number.isInteger(sourceReference.page) && sourceReference.page > 0)

  return (
    source.dataset === record.dataset &&
    source.report.trim().length > 0 &&
    Number.isInteger(source.reportYear) &&
    source.sourceUrl.startsWith('https://') &&
    sourceReference.table.trim().length > 0 &&
    pageIsValid &&
    references.some(
      (reference) =>
        reference?.table === sourceReference.table &&
        (sourceReference.page === undefined ||
          reference.page === sourceReference.page),
    )
  )
}

function isObserved(record: EvidenceRecord | undefined): record is EvidenceRecord & {
  readonly status: 'observed'
  readonly value: number
} {
  return (
    record?.status === 'observed' &&
    typeof record.value === 'number' &&
    Number.isFinite(record.value) &&
    hasNisrProvenance(record)
  )
}

type ObservedRecord = EvidenceRecord & {
  readonly status: 'observed'
  readonly value: number
}

function isSupportedYieldUnit(value: string): boolean {
  return normalize(value).replaceAll(' ', '') === 'kg/ha'
}

function isPercentageUnit(value: string): boolean {
  return normalize(value) === '%'
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function evidenceIds(
  sourceRecordIds: readonly string[],
  derivedEvidenceIds: readonly string[],
): string[] {
  return unique([...sourceRecordIds, ...derivedEvidenceIds])
}

function signalId(
  signalType: AgriculturalSignal['signalType'],
  context: AgriculturalSignalContext,
): string {
  return [
    signalType,
    normalizeDistrict(context.district),
    normalize(context.crop).replaceAll(' ', '-'),
    context.season,
    normalizeYear(context.year).replace('/', '-'),
  ].join(':')
}

function period(context: AgriculturalSignalContext): AgriculturalSignalPeriod {
  return { year: normalizeYear(context.year), season: context.season }
}

function observedIds(records: readonly EvidenceRecord[]): string[] {
  return unique(records.filter(isObserved).map((record) => record.id))
}

function sourceIds(records: readonly (EvidenceRecord | undefined)[]): string[] {
  return unique(records.flatMap((record) => (record ? [record.id] : [])))
}

function observedCandidates(
  index: EvidenceIndex,
  context: AgriculturalSignalContext,
): EvidenceRecord[] {
  return [...(index.districtYieldsByDimensions.get(
    indexKey([
      normalizeDistrict(context.district),
      context.crop,
      context.season,
    ]),
  ) ?? [])].filter(
    (record) =>
      record.indicator === 'average_yield' &&
      isDistrict(record, context.district) &&
      normalize(record.crop ?? '') === normalize(context.crop) &&
      record.period.season === context.season &&
      hasNisrProvenance(record),
  )
}

function getNationalReference(
  index: EvidenceIndex,
  districtRecord: EvidenceRecord,
): EvidenceRecord | undefined {
  if (!districtRecord.referenceEvidenceId) return undefined
  return index.recordsById.get(districtRecord.referenceEvidenceId)
}

function getDistrictRecords(
  index: EvidenceIndex,
  district: string,
): readonly EvidenceRecord[] {
  return index.districtRecordsByGeography.get(normalizeDistrict(district)) ?? []
}

function getNationalRecords(
  index: EvidenceIndex,
  geographyId: string,
): readonly EvidenceRecord[] {
  return index.nationalRecordsByGeography.get(normalizeDistrict(geographyId)) ?? []
}

function getComparableYieldPair(
  district: EvidenceRecord | undefined,
  national: EvidenceRecord | undefined,
  context: AgriculturalSignalContext,
): { readonly district: ObservedRecord; readonly national: ObservedRecord } | undefined {
  const comparable =
    isObserved(district) &&
    isObserved(national) &&
    district.geography.level === 'district' &&
    national.geography.level === 'national' &&
    normalize(national.geography.id) === 'rwanda' &&
    district.dataset === national.dataset &&
    district.indicator === 'average_yield' &&
    national.indicator === 'average_yield' &&
    normalize(district.crop ?? '') === normalize(context.crop) &&
    normalize(national.crop ?? '') === normalize(context.crop) &&
    district.period.year === normalizeYear(context.year) &&
    national.period.year === normalizeYear(context.year) &&
    district.period.season === context.season &&
    national.period.season === context.season &&
    district.unit === national.unit &&
    isSupportedYieldUnit(district.unit) &&
    district.sourceReference.table === national.sourceReference.table &&
    district.referenceEvidenceId === national.id &&
    district.referenceValue === national.value
  if (!comparable || !isObserved(district) || !isObserved(national)) {
    return undefined
  }
  return { district, national }
}

function getDerivedGapRecord(
  index: EvidenceIndex,
  district: EvidenceRecord,
  national: EvidenceRecord,
): EvidenceRecord | undefined {
  if (!isObserved(district) || !isObserved(national) || national.value <= 0) {
    return undefined
  }

  const expectedRelativeGap =
    ((district.value - national.value) / national.value) * 100

  return index.derivedGapsBySourcePair
    .get(sourcePairKey([district.id, national.id]))
    ?.find(
    (record) =>
      record.status === 'derived' &&
      hasNisrProvenance(record) &&
      record.indicator === 'yield_gap' &&
      record.dataset === district.dataset &&
      record.period.year === district.period.year &&
      record.period.season === district.period.season &&
      normalize(record.crop ?? '') === normalize(district.crop ?? '') &&
      record.geography.level === 'district' &&
      normalize(record.geography.id) === normalize(district.geography.id) &&
      record.unit === '%' &&
      record.value === expectedRelativeGap &&
      record.referenceEvidenceId === national.id &&
      record.sourceReference.table === district.sourceReference.table &&
      record.sourceReference.page === district.sourceReference.page &&
      record.derivedFromEvidenceIds?.length === 2 &&
      record.derivedFromEvidenceIds.includes(district.id) &&
      record.derivedFromEvidenceIds.includes(national.id),
  )
}

function createProductivityGapSignal(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): ProductivityGapSignal {
  const index = getEvidenceIndex(records)
  const candidates = observedCandidates(index, context).filter(
    (record) => record.period.year === normalizeYear(context.year),
  )
  const district = candidates.length === 1 ? candidates[0] : undefined
  const national = district ? getNationalReference(index, district) : undefined
  const comparable = getComparableYieldPair(district, national, context)
  const connectedRecords = [district, national].filter(
    (record): record is EvidenceRecord => record !== undefined,
  )
  const sourceRecordIds = sourceIds(connectedRecords)
  const observedEvidenceIds = observedIds(connectedRecords)
  const derivedGap =
    comparable
      ? getDerivedGapRecord(index, comparable.district, comparable.national)
      : undefined
  const derivedEvidenceIds = derivedGap ? [derivedGap.id] : []

  if (!comparable) {
    const reasons = [
      'A district and Rwanda yield observation must both be observed for the same crop, season, agricultural year, dataset, and Kg/Ha unit.',
    ]
    if (candidates.length > 1) {
      reasons.push('More than one district yield record matches this selection; the comparison is ambiguous.')
    }
    if (district && !national) {
      reasons.push('The district record does not resolve to a connected national reference record.')
    }
    return {
      id: signalId('productivity_gap', context),
      signalType: 'productivity_gap',
      status: 'insufficient_evidence',
      district: context.district,
      crop: context.crop,
      period: period(context),
      title: 'Productivity gap',
      summary: 'Insufficient connected NISR evidence for this district, crop, and period.',
      rationale: reasons,
      limitations,
      observedEvidenceIds,
      derivedEvidenceIds,
      sourceRecordIds,
      evidenceIds: evidenceIds(sourceRecordIds, derivedEvidenceIds),
    }
  }

  const { district: observedDistrict, national: observedNational } = comparable
  const absoluteGap = observedDistrict.value - observedNational.value
  const status =
    absoluteGap < 0
      ? 'below_reference'
      : absoluteGap > 0
        ? 'above_reference'
        : 'at_reference'
  const relativeGapPct =
    observedNational.value > 0
      ? (absoluteGap / observedNational.value) * 100
      : undefined

  return {
    id: signalId('productivity_gap', context),
    signalType: 'productivity_gap',
    status,
    district: observedDistrict.geography.name,
    crop: observedDistrict.crop ?? context.crop,
    period: period(context),
    title: 'Productivity gap',
    summary:
      status === 'below_reference'
        ? 'District yield is below the national reference for this period.'
        : status === 'above_reference'
          ? 'District yield is above the national reference for this period.'
          : 'District yield is at the national reference for this period.',
    rationale: [
      `Absolute gap = district yield − national yield = ${absoluteGap.toLocaleString('en-RW')} ${observedDistrict.unit}.`,
      relativeGapPct === undefined
        ? 'Relative gap is unavailable because the national reference is zero.'
        : 'Relative gap = absolute gap divided by national yield, multiplied by 100.',
    ],
    limitations,
    districtYield: observedDistrict.value,
    nationalYield: observedNational.value,
    absoluteGap,
    ...(relativeGapPct !== undefined ? { relativeGapPct } : {}),
    unit: observedDistrict.unit,
    observedEvidenceIds,
    derivedEvidenceIds,
    sourceRecordIds,
    evidenceIds: evidenceIds(sourceRecordIds, derivedEvidenceIds),
  }
}

function agriculturalYearStart(value: string): number | undefined {
  const match = value.match(/^(\d{4})\/\d{2}$/)
  return match ? Number(match[1]) : undefined
}

function createProductivityTrendSignal(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): ProductivityTrendSignal {
  const index = getEvidenceIndex(records)
  const candidates = observedCandidates(index, context)
  const sourceRecordIds = sourceIds(candidates)
  const observedEvidenceIds = observedIds(candidates)
  const byYear = new Map<string, EvidenceRecord[]>()
  for (const record of candidates) {
    const group = byYear.get(record.period.year) ?? []
    group.push(record)
    byYear.set(record.period.year, group)
  }
  const periodsUsed = [...byYear.keys()].sort(
    (first, second) =>
      (agriculturalYearStart(first) ?? Number.MAX_SAFE_INTEGER) -
      (agriculturalYearStart(second) ?? Number.MAX_SAFE_INTEGER),
  )
  const invalidPeriod = periodsUsed.some(
    (year) => agriculturalYearStart(year) === undefined,
  )
  const ambiguousPeriod = [...byYear.values()].some((group) => group.length !== 1)
  const recordsAreObserved = candidates.every(isObserved)
  const unitIsComparable = candidates.every(
    (record) =>
      record.unit === candidates[0]?.unit && isSupportedYieldUnit(record.unit),
  )
  const hasUnavailableCandidate = candidates.some(
    (record) => record.status !== 'observed' || record.value === null,
  )
  const canCompare =
    candidates.length >= 2 &&
    periodsUsed.length >= 2 &&
    !invalidPeriod &&
    !ambiguousPeriod &&
    recordsAreObserved &&
    unitIsComparable &&
    !hasUnavailableCandidate

  if (!canCompare) {
    const rationale = [
      'At least two distinct agricultural years with comparable observed district yield are required for the same crop, season, indicator, and Kg/Ha unit.',
    ]
    if (hasUnavailableCandidate) {
      rationale.push('A matching period has an unavailable or missing yield value, so the time comparison is not calculated.')
    } else if (ambiguousPeriod) {
      rationale.push('A matching agricultural year has multiple district yield records, so the period is ambiguous.')
    }
    return {
      id: signalId('productivity_trend', context),
      signalType: 'productivity_trend',
      status: 'insufficient_evidence',
      district: context.district,
      crop: context.crop,
      period: period(context),
      title: 'Productivity direction',
      summary: 'Insufficient comparable periods to calculate productivity direction.',
      rationale,
      limitations: [
        ...limitations,
        'Direction compares the earliest and latest available comparable agricultural years. It is not a statistical significance test.',
      ],
      periodsUsed,
      observedEvidenceIds,
      derivedEvidenceIds: [],
      sourceRecordIds,
      evidenceIds: sourceRecordIds,
    }
  }

  const firstRecord = byYear.get(periodsUsed[0])![0]
  const lastRecord = byYear.get(periodsUsed[periodsUsed.length - 1])![0]
  const netChange = lastRecord.value! - firstRecord.value!
  const status =
    netChange > 0
      ? 'improving'
      : netChange < 0
        ? 'declining'
        : 'relatively_stable'

  return {
    id: signalId('productivity_trend', context),
    signalType: 'productivity_trend',
    status,
    district: context.district,
    crop: context.crop,
    period: period(context),
    title: 'Productivity direction',
    summary:
      status === 'improving'
        ? 'Yield in the latest comparable period is higher than in the earliest period.'
        : status === 'declining'
          ? 'Yield in the latest comparable period is lower than in the earliest period.'
          : 'Yield is unchanged between the earliest and latest comparable periods.',
    rationale: [
      `Net change = latest yield (${lastRecord.value!.toLocaleString('en-RW')} ${lastRecord.unit}) − earliest yield (${firstRecord.value!.toLocaleString('en-RW')} ${firstRecord.unit}) = ${netChange.toLocaleString('en-RW')} ${lastRecord.unit}.`,
      `Comparable agricultural years used: ${periodsUsed.join(', ')}.`,
    ],
    limitations: [
      ...limitations,
      'Direction compares the earliest and latest available comparable agricultural years. It is not a statistical significance test and does not attribute the change to a cause.',
    ],
    periodsUsed,
    netChange,
    unit: lastRecord.unit,
    observedEvidenceIds,
    derivedEvidenceIds: [],
    sourceRecordIds,
    evidenceIds: sourceRecordIds,
  }
}

function createIrrigationInvestigationSignal(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): IrrigationInvestigationSignal {
  const index = getEvidenceIndex(records)
  const periodYear = normalizeYear(context.year)
  const matchingDistrictYields = observedCandidates(index, context).filter(
    (record) => record.period.year === periodYear,
  )
  const districtYield =
    matchingDistrictYields.length === 1 ? matchingDistrictYields[0] : undefined
  const nationalYield = districtYield
    ? getNationalReference(index, districtYield)
    : undefined
  const matchingDistrictIrrigation = getDistrictRecords(index, context.district).filter(
    (record) =>
      record.indicator === 'irrigation_practice' &&
      record.period.year === periodYear &&
      record.period.season === context.season &&
      (!districtYield || record.dataset === districtYield.dataset),
  )
  const matchingNationalIrrigation = getNationalRecords(index, 'rwanda').filter(
    (record) =>
      record.indicator === 'irrigation_practice' &&
      record.period.year === periodYear &&
      record.period.season === context.season &&
      (!districtYield || record.dataset === districtYield.dataset),
  )
  const districtIrrigation =
    matchingDistrictIrrigation.length === 1
      ? matchingDistrictIrrigation[0]
      : undefined
  const nationalIrrigation =
    matchingNationalIrrigation.length === 1
      ? matchingNationalIrrigation[0]
      : undefined
  const connected = [districtYield, nationalYield, districtIrrigation, nationalIrrigation]
  const sourceRecordIds = sourceIds(connected)
  const observedEvidenceIds = observedIds(connected.filter(
    (record): record is EvidenceRecord => record !== undefined,
  ))
  const isMaize = normalize(context.crop) === 'maize'
  const yieldPair =
    isMaize
      ? getComparableYieldPair(districtYield, nationalYield, context)
      : undefined
  const validIrrigationPair =
    isObserved(districtIrrigation) &&
    isObserved(nationalIrrigation) &&
    districtIrrigation.geography.level === 'district' &&
    nationalIrrigation.geography.level === 'national' &&
    normalize(nationalIrrigation.geography.id) === 'rwanda' &&
    districtIrrigation.dataset === nationalIrrigation.dataset &&
    districtIrrigation.dataset === districtYield?.dataset &&
    districtIrrigation.period.year === periodYear &&
    nationalIrrigation.period.year === periodYear &&
    districtIrrigation.period.season === context.season &&
    nationalIrrigation.period.season === context.season &&
    districtIrrigation.geography.id === districtYield?.geography.id &&
    districtIrrigation.geography.name === districtYield?.geography.name &&
    districtIrrigation.crop === undefined &&
    nationalIrrigation.crop === undefined &&
    districtIrrigation.sourceReference.table ===
      nationalIrrigation.sourceReference.table &&
    districtIrrigation.unit === nationalIrrigation.unit &&
    isPercentageUnit(districtIrrigation.unit) &&
    districtIrrigation.value >= 0 &&
    districtIrrigation.value <= 100 &&
    nationalIrrigation.value >= 0 &&
    nationalIrrigation.value <= 100 &&
    districtIrrigation.referenceEvidenceId === nationalIrrigation.id &&
    districtIrrigation.referenceValue === nationalIrrigation.value

  const rationale: string[] = []
  if (!isMaize) {
    rationale.push('The connected irrigation investigation screen currently requires maize yield evidence; no other crop is substituted.')
  }
  if (!yieldPair) {
    rationale.push('Comparable observed district and national maize yield records for the selected period are required.')
  }
  if (!validIrrigationPair) {
    rationale.push('Comparable observed district-wide and national irrigation practice records for the selected period are required.')
  }

  let status: IrrigationInvestigationSignal['status'] = 'insufficient_evidence'
  if (
    yieldPair &&
    validIrrigationPair &&
    isObserved(districtIrrigation) &&
    isObserved(nationalIrrigation)
  ) {
    if (
      yieldPair.district.value < yieldPair.national.value &&
      districtIrrigation.value < nationalIrrigation.value
    ) {
      status = 'supported'
      rationale.push('District maize yield and district-wide irrigation practice are both below their same-period national references.')
      rationale.push('This pattern identifies irrigation as an evidence-supported area for further investigation.')
    } else {
      status = 'conditions_not_met'
      if (yieldPair.district.value >= yieldPair.national.value) {
        rationale.push('District maize yield is at or above its same-period national reference.')
      }
      if (districtIrrigation.value >= nationalIrrigation.value) {
        rationale.push('District-wide irrigation practice is at or above its same-period national reference.')
      }
    }
  }

  return {
    id: signalId('irrigation_investigation', context),
    signalType: 'irrigation_investigation',
    intervention: 'irrigation',
    status,
    district: context.district,
    crop: context.crop,
    period: { ...period(context), crop: context.crop },
    title: 'Irrigation investigation',
    summary:
      status === 'supported'
        ? 'This pattern identifies irrigation as an evidence-supported area for further investigation.'
        : status === 'conditions_not_met'
          ? 'The required evidence is available, but the irrigation signal conditions are not met.'
          : 'Insufficient connected NISR evidence for this district, crop, and period.',
    rationale,
    limitations,
    observedEvidenceIds,
    derivedEvidenceIds: [],
    sourceRecordIds,
    evidenceIds: sourceRecordIds,
  }
}

/** The single registry for the three currently supported agricultural signals. */
export const agriculturalSignalRegistry: Readonly<
  Record<AgriculturalSignalType, SignalBuilder>
> = {
  productivity_gap: createProductivityGapSignal,
  productivity_trend: createProductivityTrendSignal,
  irrigation_investigation: createIrrigationInvestigationSignal,
}

export function calculateAgriculturalSignals(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): readonly [ProductivityGapSignal, ProductivityTrendSignal, IrrigationInvestigationSignal] {
  const builders = agriculturalSignalRegistry
  return [
    builders.productivity_gap(records, context) as ProductivityGapSignal,
    builders.productivity_trend(records, context) as ProductivityTrendSignal,
    builders.irrigation_investigation(records, context) as IrrigationInvestigationSignal,
  ]
}

export function calculateProductivityGap(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): ProductivityGapSignal {
  return createProductivityGapSignal(records, context)
}

export function calculateProductivityTrend(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): ProductivityTrendSignal {
  return createProductivityTrendSignal(records, context)
}

export function calculateIrrigationInvestigation(
  records: readonly EvidenceRecord[],
  context: AgriculturalSignalContext,
): IrrigationInvestigationSignal {
  return createIrrigationInvestigationSignal(records, context)
}
