import type { EvidenceRecord } from '../../evidence/types/evidence.types'
import type {
  InterventionPeriod,
  InterventionSignal,
  InterventionType,
} from '../../../types/intervention'

interface InterventionContext extends InterventionPeriod {
  readonly district: string
}

const unsupportedInterventions: readonly {
  readonly intervention: InterventionType
  readonly title: string
}[] = [
  { intervention: 'soil_fertility', title: 'Soil fertility' },
  {
    intervention: 'post_harvest',
    title: 'Post-harvest collection and storage',
  },
  { intervention: 'processing', title: 'Processing and value addition' },
  { intervention: 'export', title: 'Export opportunities' },
]

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function isObservedValue(record: EvidenceRecord | undefined): record is EvidenceRecord & {
  readonly value: number
  readonly status: 'observed'
} {
  return (
    record?.status === 'observed' &&
    record.value !== null &&
    Number.isFinite(record.value)
  )
}

function matchesPeriod(
  record: EvidenceRecord,
  context: InterventionContext,
): boolean {
  return (
    record.period.year === context.year &&
    record.period.season === context.season
  )
}

function findRecord(
  records: readonly EvidenceRecord[],
  indicator: EvidenceRecord['indicator'],
  geographyLevel: 'district' | 'national',
  geographyId: string,
  context: InterventionContext,
): EvidenceRecord | undefined {
  return records.find((record) => {
    if (
      record.indicator !== indicator ||
      record.geography.level !== geographyLevel ||
      normalize(record.geography.id) !== normalize(geographyId) ||
      !matchesPeriod(record, context)
    ) {
      return false
    }

    return (
      indicator === 'irrigation_practice' ||
      normalize(record.crop ?? '') === normalize(context.crop)
    )
  })
}

function createSignal(
  intervention: InterventionType,
  title: string,
  status: InterventionSignal['status'],
  rationale: readonly string[],
  evidenceIds: readonly string[],
  context: InterventionContext,
): InterventionSignal {
  return {
    intervention,
    status,
    title,
    rationale,
    evidenceIds,
    period: {
      crop: context.crop,
      year: context.year,
      season: context.season,
    },
  }
}

/**
 * Screens evidence for district investigation areas. Only the irrigation rule
 * is currently connected; the other areas remain explicitly unsupported.
 */
export function calculateInterventionSignals(
  records: readonly EvidenceRecord[],
  context: InterventionContext,
): readonly InterventionSignal[] {
  const districtId = normalize(context.district).replaceAll(' ', '-')
  const [districtYield, nationalYield, districtIrrigation, nationalIrrigation] =
    [
      findRecord(records, 'average_yield', 'district', districtId, context),
      findRecord(records, 'average_yield', 'national', 'rwanda', context),
      findRecord(
        records,
        'irrigation_practice',
        'district',
        districtId,
        context,
      ),
      findRecord(
        records,
        'irrigation_practice',
        'national',
        'rwanda',
        context,
      ),
    ]

  const supportingRecords = [
    districtYield,
    nationalYield,
    districtIrrigation,
    nationalIrrigation,
  ].filter((record): record is EvidenceRecord => record !== undefined)
  const evidenceIds = supportingRecords.map((record) => record.id)
  const validYieldPair =
    isObservedValue(districtYield) &&
    isObservedValue(nationalYield) &&
    districtYield.unit === nationalYield.unit &&
    districtYield.referenceValue === nationalYield.value &&
    districtYield.referenceEvidenceId === nationalYield.id
  const validIrrigationPair =
    isObservedValue(districtIrrigation) &&
    isObservedValue(nationalIrrigation) &&
    districtIrrigation.unit === nationalIrrigation.unit &&
    districtIrrigation.referenceValue === nationalIrrigation.value &&
    districtIrrigation.referenceEvidenceId === nationalIrrigation.id
  const isMaizeContext = normalize(context.crop) === 'maize'

  const irrigationRationale: string[] = []
  if (!isMaizeContext) {
    irrigationRationale.push(
      'This investigation screen requires same-period maize yield evidence; no other crop is substituted.',
    )
  }
  if (!validYieldPair) {
    irrigationRationale.push(
      'Same-period observed district and national maize yield records with a matching reference are required.',
    )
  }
  if (!validIrrigationPair) {
    irrigationRationale.push(
      'Same-period observed district-wide and national irrigation practice records with a matching reference are required.',
    )
  }

  let irrigationSupported =
    isMaizeContext && validYieldPair && validIrrigationPair

  if (validYieldPair && districtYield.value >= nationalYield.value) {
    irrigationSupported = false
    irrigationRationale.push(
      'District maize yield is not below its same-period national reference.',
    )
  }

  if (
    validIrrigationPair &&
    districtIrrigation.value >= nationalIrrigation.value
  ) {
    irrigationSupported = false
    irrigationRationale.push(
      'District-wide irrigation practice is not below its same-period national reference.',
    )
  }

  if (irrigationSupported) {
    irrigationRationale.push(
      'District maize yield and district-wide irrigation practice are both below their same-period national references.',
      'This comparison identifies an area for further investigation. It does not establish that lower irrigation caused the yield gap.',
    )
  } else if (irrigationRationale.length === 0) {
    irrigationRationale.push(
      'The connected evidence does not meet both conditions for an irrigation investigation signal.',
    )
  }

  const irrigationSignal = createSignal(
    'irrigation',
    'Irrigation',
    irrigationSupported ? 'supported' : 'insufficient_evidence',
    irrigationRationale,
    evidenceIds,
    context,
  )

  return [
    irrigationSignal,
    ...unsupportedInterventions.map(({ intervention, title }) =>
      createSignal(
        intervention,
        title,
        'insufficient_evidence',
        [
          'No connected evidence currently supports a district-specific intervention signal for this area.',
        ],
        [],
        context,
      ),
    ),
  ]
}
