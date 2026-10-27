import { useMemo, useState } from 'react'
import { Database, RotateCcw, Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { evidenceRecords } from '../data/evidenceRecords'
import type {
  EvidenceIndicator,
  EvidenceNavigationContext,
  EvidenceRecord,
} from '../types/evidence.types'
import { EvidenceRecordCard } from '../components/EvidenceRecordCard'
import { EvidenceStatusBadge } from '../components/EvidenceStatusBadge'

interface EvidencePageProps {
  context?: EvidenceNavigationContext
  selectedDistrict?: string
  selectedCrop?: string
  selectedSeason?: string
  selectedYear?: string
  onOpenDistrictProfile: (district: string) => void
}

const indicatorOptions: readonly {
  label: string
  value: 'all' | EvidenceIndicator
}[] = [
  { label: 'All indicators', value: 'all' },
  ...[
    ...new Map(
      evidenceRecords.map((record) => [record.indicator, record.label]),
    ),
  ]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([value, label]) => ({
      value: value as EvidenceIndicator,
      label,
    })),
]

const selectClassName =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors hover:border-slate-300 focus:border-agri-700 focus:ring-2 focus:ring-agri-700/10'

const districts = Array.from(
  new Set(
    evidenceRecords
      .filter((record) => record.geography.level === 'district')
      .map((record) => record.geography.name),
  ),
).sort((first, second) => first.localeCompare(second))

const crops = [
  ...new Set(
    evidenceRecords.flatMap((record) =>
      record.crop && record.status === 'observed' ? [record.crop] : [],
    ),
  ),
].sort((first, second) => first.localeCompare(second))

const seasons = [
  ...new Set(
    evidenceRecords.flatMap((record) =>
      record.period.season ? [record.period.season] : [],
    ),
  ),
].sort()

const years = [...new Set(evidenceRecords.map((record) => record.period.year))]
  .sort()
  .reverse()
const datasets = [
  ...new Set(evidenceRecords.map((record) => record.dataset)),
].sort((first, second) => first.localeCompare(second))

function comparisonKey(record: EvidenceRecord): string {
  return JSON.stringify([
    record.dataset,
    record.indicator,
    record.crop,
    record.species,
    record.category,
    record.period.year,
    record.period.season,
    record.period.label,
    record.unit,
  ])
}

const districtObservationKeys = new Map<string, Set<string>>()
for (const record of evidenceRecords) {
  if (record.geography.level !== 'district') continue
  const keys =
    districtObservationKeys.get(record.geography.name) ?? new Set<string>()
  keys.add(comparisonKey(record))
  districtObservationKeys.set(record.geography.name, keys)
}

function hasDistrictReference(
  record: EvidenceRecord,
  district: string,
): boolean {
  return (
    district !== 'Rwanda' &&
    record.geography.level === 'national' &&
    districtObservationKeys.get(district)?.has(comparisonKey(record)) === true
  )
}

function matchesSeason(
  recordSeason: string | undefined,
  selected: string,
): boolean {
  if (selected === 'all') return true
  return selected === 'none'
    ? recordSeason === undefined
    : recordSeason === selected
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <label
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        className={selectClassName}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </div>
  )
}

export function EvidencePage({
  context,
  selectedDistrict,
  selectedCrop,
  selectedSeason,
  selectedYear,
  onOpenDistrictProfile,
}: EvidencePageProps) {
  const [signalContext, setSignalContext] = useState(context)
  const hasSignalContext = signalContext?.signalType !== undefined
  const hasEvidenceSelection =
    hasSignalContext || signalContext?.evidenceIds !== undefined
  const [district, setDistrict] = useState(
    context?.district ?? selectedDistrict ?? 'all',
  )
  const [crop, setCrop] = useState(
    hasSignalContext || hasEvidenceSelection
      ? 'all'
      : ((context?.crop ?? selectedCrop)?.toLowerCase() ?? 'all'),
  )
  const [season, setSeason] = useState<string>(
    context?.season ??
      selectedSeason?.replace('season-', '').toUpperCase() ??
      'A',
  )
  const [year, setYear] = useState(
    context?.signalType === 'productivity_trend'
      ? 'all'
      : (context?.year ?? selectedYear?.replace('-', '/') ?? '2024/25'),
  )
  const [dataset, setDataset] = useState('all')
  const [status, setStatus] = useState<'all' | EvidenceRecord['status']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [indicator, setIndicator] = useState<'all' | EvidenceIndicator>(
    hasSignalContext || hasEvidenceSelection ? 'all' : 'average_yield',
  )
  const [visiblePage, setVisiblePage] = useState({ key: '', count: 50 })
  const filterKey = JSON.stringify([
    district,
    crop,
    season,
    year,
    dataset,
    status,
    indicator,
    searchQuery,
    signalContext?.intervention,
    signalContext?.signalType,
    signalContext?.evidenceIds,
  ])
  const visibleCount = visiblePage.key === filterKey ? visiblePage.count : 50
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredRecords = useMemo(
    () =>
      evidenceRecords.filter((record) => {
        const districtMatches =
          district === 'all' ||
          record.geography.name === district ||
          hasDistrictReference(record, district)
        const cropMatches =
          crop === 'all' || record.crop?.toLowerCase() === crop
        const seasonMatches = matchesSeason(record.period.season, season)
        const yearMatches = year === 'all' || record.period.year === year
        const indicatorMatches =
          indicator === 'all' || record.indicator === indicator
        const datasetMatches = dataset === 'all' || record.dataset === dataset
        const statusMatches = status === 'all' || record.status === status
        const evidenceSelectionMatches =
          !hasEvidenceSelection ||
          signalContext?.evidenceIds?.includes(record.id) === true

        const searchMatches =
          !normalizedQuery ||
          [
            record.id,
            record.label,
            record.dataset,
            record.source.report,
            record.sourceReference.table,
            record.sourceReference.page,
            record.geography.name,
            record.geography.level,
            record.crop,
            record.sourceCrop,
            record.period.year,
            record.period.season,
            record.period.label,
            record.category,
            record.species,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)

        return (
          districtMatches &&
          cropMatches &&
          seasonMatches &&
          yearMatches &&
          indicatorMatches &&
          datasetMatches &&
          statusMatches &&
          evidenceSelectionMatches &&
          searchMatches
        )
      }),
    [
      crop,
      dataset,
      district,
      hasEvidenceSelection,
      indicator,
      normalizedQuery,
      season,
      signalContext,
      status,
      year,
    ],
  )

  const resetFilters = () => {
    setSignalContext(undefined)
    setDistrict('all')
    setCrop('all')
    setSeason('all')
    setYear('all')
    setDataset('all')
    setStatus('all')
    setIndicator('all')
    setSearchQuery('')
  }

  const signalLabel = signalContext?.signalType
    ? {
        productivity_gap: 'Productivity gap',
        productivity_trend: 'Productivity direction',
        irrigation_investigation: 'Irrigation investigation signal',
      }[signalContext.signalType]
    : signalContext?.intervention
  const visibleRecords = filteredRecords.slice(0, visibleCount)

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-agri-700">
          Agricultural evidence
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-forest-950 sm:text-4xl">
          Evidence explorer
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Inspect the NISR observation, national comparison, calculated
          difference, and source behind each connected signal.
        </p>
      </header>

      {hasSignalContext && (
        <section
          aria-label="Agricultural signal evidence context"
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50/70 p-4 sm:p-5"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
              Supporting evidence · {signalLabel}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-900">
              {signalContext.district} · {signalContext.crop} · Season{' '}
              {signalContext.season} ·{' '}
              {signalContext.signalType === 'productivity_trend'
                ? 'comparable years'
                : signalContext.year}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              These connected NISR records are the inputs referenced by this
              signal. The calculation identifies an evidence pattern; it does
              not establish cause or impact.
            </p>
          </div>
          <button
            className="inline-flex min-h-10 shrink-0 items-center rounded-md px-2 text-xs font-semibold text-green-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={() => {
              setSignalContext(undefined)
              setDistrict('all')
              setCrop('all')
              setSeason('A')
              setYear('2024/25')
              setIndicator('average_yield')
              setDataset('all')
              setStatus('all')
              setSearchQuery('')
            }}
            type="button"
          >
            Clear signal context
          </button>
        </section>
      )}

      {!hasSignalContext && hasEvidenceSelection && (
        <p
          className="rounded-xl border border-green-200 bg-green-50/70 p-4 text-sm leading-6 text-slate-700"
          role="status"
        >
          Showing the district and national source records selected in the
          District Profile.
        </p>
      )}

      <section
        aria-label="Evidence filters"
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div>
          <label
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
            htmlFor="evidence-search"
          >
            Search records
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-agri-700 focus:ring-2 focus:ring-agri-700/10"
              id="evidence-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Crop, district, NISR table or evidence ID"
              type="search"
              value={searchQuery}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            id="evidence-district"
            label="District"
            onChange={setDistrict}
            value={district}
          >
            <option value="all">All geographies</option>
            <option value="Rwanda">National · Rwanda</option>
            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="evidence-crop"
            label="Crop"
            onChange={setCrop}
            value={crop}
          >
            <option value="all">All crops and practices</option>
            {crops.map((name) => (
              <option key={name} value={name.toLowerCase()}>
                {name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="evidence-season"
            label="Season"
            onChange={setSeason}
            value={season}
          >
            <option value="all">All seasons</option>
            {seasons.map((value) => (
              <option key={value} value={value}>
                Season {value}
              </option>
            ))}
            <option value="none">Annual / no SAS season</option>
          </FilterSelect>
          <FilterSelect
            id="evidence-year"
            label="Agricultural year"
            onChange={setYear}
            value={year}
          >
            <option value="all">All referenced years</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </FilterSelect>
        </div>

        <details className="rounded-xl border border-slate-100 bg-warm-50 px-3 sm:px-4">
          <summary className="flex min-h-10 cursor-pointer flex-wrap items-center justify-between gap-2 py-2 text-sm font-semibold text-forest-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2">
            More filters
            <span className="text-xs font-medium text-slate-500">
              Dataset, indicator, evidence status
            </span>
          </summary>
          <div className="grid gap-3 border-t border-slate-200 py-3 md:grid-cols-3">
            <FilterSelect
              id="evidence-dataset"
              label="Dataset"
              onChange={setDataset}
              value={dataset}
            >
              <option value="all">All NISR datasets</option>
              {datasets.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              id="evidence-indicator"
              label="Indicator"
              onChange={(value) =>
                setIndicator(value as 'all' | EvidenceIndicator)
              }
              value={indicator}
            >
              {indicatorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              id="evidence-status"
              label="Evidence status"
              onChange={(value) =>
                setStatus(value as 'all' | EvidenceRecord['status'])
              }
              value={status}
            >
              <option value="all">All statuses</option>
              <option value="observed">Observed</option>
              <option value="derived">Derived</option>
              <option value="unavailable">Unavailable</option>
            </FilterSelect>
          </div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-xs leading-5 text-slate-500">
            Search covers record IDs, NISR source tables, reports and geography.
          </p>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-forest-950 transition-colors hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2"
            onClick={resetFilters}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Reset filters
          </button>
        </div>
      </section>

      <section aria-labelledby="evidence-results-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <h2
              className="flex items-center gap-2 text-base font-bold text-forest-950"
              id="evidence-results-heading"
            >
              <Database
                aria-hidden="true"
                className="size-4 shrink-0 text-agri-700"
              />
              Source-backed observations
            </h2>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {filteredRecords.length}{' '}
              {filteredRecords.length === 1 ? 'record' : 'records'}
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            aria-label="Evidence status legend"
          >
            <EvidenceStatusBadge status="observed" />
            <EvidenceStatusBadge status="derived" />
            <EvidenceStatusBadge status="unavailable" />
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            {visibleRecords.map((record) => (
              <EvidenceRecordCard
                key={record.id}
                onOpenDistrictProfile={onOpenDistrictProfile}
                record={record}
              />
            ))}
          </div>
        ) : (
          <div
            aria-live="polite"
            className="rounded-xl border border-dashed border-slate-300 bg-white p-5 sm:p-6"
            role="status"
          >
            <EvidenceStatusBadge status="unavailable" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              No connected observation for these filters
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              No source row matches these exact filters. AII does not carry a
              value from another crop, year, season, dataset, or geography.
            </p>
          </div>
        )}
        {visibleCount < filteredRecords.length && (
          <button
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 sm:w-auto"
            onClick={() =>
              setVisiblePage({ key: filterKey, count: visibleCount + 50 })
            }
            type="button"
          >
            Show {Math.min(50, filteredRecords.length - visibleCount)} more
            observations
          </button>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Irrigation practice is a district-wide estimate across crop activity. It
        is not a maize-specific measure. A calculated difference compares the
        displayed observation with the cited national reference.
      </p>
    </div>
  )
}
