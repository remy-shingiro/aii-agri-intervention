import { ArrowUpRight, BookOpenText, Calculator, MapPinned } from 'lucide-react'

import { MethodologySection } from '../components/MethodologySection'
import {
  nisrDataInventory,
  normalizedEvidenceRecords,
} from '../../evidence/data/agriculturalEvidence'

function datasetCoverage(dataset: string) {
  const records = normalizedEvidenceRecords.filter(
    (record) => record.dataset === dataset,
  )
  return {
    records: records.length,
    observed: records.filter((record) => record.status === 'observed').length,
    unavailable: records.filter((record) => record.status === 'unavailable').length,
    districtRows: records.filter((record) => record.geography.level === 'district').length,
    provinceRows: records.filter((record) => record.geography.level === 'province').length,
    nationalRows: records.filter((record) => record.geography.level === 'national').length,
    crops: new Set(records.flatMap((record) => record.crop ? [record.crop] : [])).size,
    tables: new Set(records.map((record) => record.sourceReference.table)).size,
    seasons: [...new Set(records.flatMap((record) => record.period.season ? [record.period.season] : []))],
  }
}

const sas2024Coverage = datasetCoverage('SAS 2024')
const sas2025Coverage = datasetCoverage('SAS 2025')
const ahsCoverage = datasetCoverage('AHS 2024')
const inventoryCatalogCount = nisrDataInventory.filter(
  (record) => record.extractionStatus === 'catalogued_not_connected',
).length

const sourceCards = [
  {
    name: 'Agricultural Household Survey 2024',
    role: 'National and province household evidence',
    period: 'Agricultural year 2023/24 · no SAS season',
    detail:
      `AII connects ${ahsCoverage.records} observations from ${ahsCoverage.tables} AHS tables (${ahsCoverage.observed} observed, ${ahsCoverage.unavailable} unavailable), including national and five-province household indicators plus crop-specific seed-use values. AHS remains distinct from SAS.`,
    href: 'https://www.statistics.gov.rw/data-sources/surveys/Agricultural-Household-Survey/agricultural-household-survey-2024',
  },
  {
    name: 'Seasonal Agricultural Survey 2024',
    role: 'Connected seasonal statistics',
    period: 'Agricultural year 2023/24 · Seasons A, B, and C',
    detail:
      `${sas2024Coverage.records.toLocaleString()} normalized records cover ${sas2024Coverage.crops} crop labels and district plus national rows across Seasons ${sas2024Coverage.seasons.join(', ')}. Crop columns vary by season; dash cells remain unavailable.`,
    href: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-02/SAS%202024%20Annual.pdf',
  },
  {
    name: 'Seasonal Agricultural Survey 2025',
    role: 'Connected seasonal statistics',
    period: 'Agricultural year 2024/25 · Seasons A, B, and C',
    detail:
      `${sas2025Coverage.records.toLocaleString()} normalized records cover ${sas2025Coverage.crops} crop labels and district plus national rows across Seasons ${sas2025Coverage.seasons.join(', ')}. The existing Season A maize and irrigation records retain their verified IDs and values.`,
    href: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf',
  },
] as const

const signalSteps = [
  {
    number: '01',
    title: 'District observation',
    text: 'Read the selected crop yield from the matching district, year, season, and SAS report. Production and cultivated area remain separate observed indicators.',
  },
  {
    number: '02',
    title: 'National reference',
    text: 'Use the national value from that same dataset, indicator, crop, year, season, and unit.',
  },
  {
    number: '03',
    title: 'Yield gap',
    text: 'Calculate (district yield minus national yield) divided by national yield, then multiply by 100. The percentage is derived; both input values are observed.',
  },
  {
    number: '04',
    title: 'Evidence assessment',
    text: 'Check whether same-period district evidence exists for a potential investigation area. Irrigation practice remains a district-wide measure across crop activity.',
  },
  {
    number: '05',
    title: 'Potential investigation',
    text: 'When yield is below the national reference and district-wide irrigation practice is also below its national reference, AII flags irrigation access for investigation. This is a screening rule, not a causal finding or investment recommendation.',
  },
] as const

function SourceCard({
  name,
  role,
  period,
  detail,
  href,
}: (typeof sourceCards)[number]) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
            {role}
          </p>
          <h3 className="mt-2 text-base font-semibold leading-6 text-slate-900">
            {name}
          </h3>
        </div>
        <BookOpenText
          aria-hidden="true"
          className="size-5 shrink-0 text-slate-400"
        />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-700">{period}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{detail}</p>
      <a
        className="mt-4 inline-flex min-h-10 items-center gap-1 self-start rounded-md text-sm font-semibold text-green-800 underline decoration-green-300 underline-offset-2 hover:text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        Open NISR source
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    </article>
  )
}

export function DataMethodologyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-800">
          Data transparency
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Data &amp; Methodology
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          See which NISR sources AII uses, how the district signal is
          calculated, and where the evidence stops supporting a conclusion.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
            Household context
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            NISR AHS 2024
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            AHS reference period
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            2023/24 · Annual, no SAS season
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Connected productivity signal
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            SAS 2024 and SAS 2025 · A, B, and C
          </p>
        </div>
      </div>

      <MethodologySection
        id="datasets-heading"
        intro="The reports are kept as separate datasets with their published periods and geographies. The local inventory distinguishes extracted observations from tables that are catalogued but not connected."
        title="NISR source register"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {sourceCards.map((source) => (
            <SourceCard key={source.name} {...source} />
          ))}
        </div>
      </MethodologySection>

      <MethodologySection
        id="extraction-heading"
        intro="The extraction script reads the untouched local PDF reports, preserves the printed crop header, geography, period, unit, and table page, then validates records before writing frontend JSON."
        title="Extraction and connected coverage"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { name: 'SAS 2024', coverage: sas2024Coverage },
            { name: 'SAS 2025', coverage: sas2025Coverage },
            { name: 'AHS 2024', coverage: ahsCoverage },
          ].map(({ name, coverage }) => (
            <article className="rounded-xl border border-slate-200 bg-white p-4" key={name}>
              <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Normalized records</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.records.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Observed</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.observed.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Unavailable</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.unavailable.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">District rows</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.districtRows.toLocaleString()}</dd></div>
                {coverage.provinceRows > 0 && <div className="flex justify-between gap-3"><dt className="text-slate-500">Province rows</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.provinceRows.toLocaleString()}</dd></div>}
                {coverage.nationalRows > 0 && <div className="flex justify-between gap-3"><dt className="text-slate-500">National rows</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.nationalRows.toLocaleString()}</dd></div>}
                {coverage.crops > 0 && <div className="flex justify-between gap-3"><dt className="text-slate-500">Crop labels</dt><dd className="font-semibold tabular-nums text-slate-800">{coverage.crops}</dd></div>}
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          The generated inventory contains {nisrDataInventory.length.toLocaleString()} observation and table-catalog entries. {inventoryCatalogCount} report tables are catalogued but not cell-extracted; their presence in a report is not treated as connected evidence.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Connected indicators include seasonal crop cultivated area, yield, and production; seed, fertilizer, and pesticide use; irrigation practice; erosion control; agroforestry; and mechanical equipment. AHS 2024 adds province and national input, crop-specific seed-use, practice, erosion-control, irrigation, and extension records, plus national household context for association membership, kitchen gardens, risk awareness, livestock ownership by species, and beekeeping. AHS values are never expanded to district geography.
        </p>
      </MethodologySection>

      <MethodologySection
        id="geography-heading"
        intro="A district appearing in a sample design does not, by itself, mean a district-level statistic was published."
        title="Published geography and sampling design"
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <MapPinned aria-hidden="true" className="size-5 text-green-800" />
              <h3 className="text-sm font-semibold text-slate-900">
                Published analytical geography
              </h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              AII displays a district figure only when a NISR table reports
              that indicator for the district. SAS 2024 and SAS 2025 connected
              crop and practice tables contain district and national rows.
              AHS Tables 1 and 19–27 contribute national and province values,
              including crop-specific seed-use values. AHS does not provide
              district observations in the connected tables, and no province
              value is copied down to districts.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Calculator
                aria-hidden="true"
                className="size-5 text-slate-600"
              />
              <h3 className="text-sm font-semibold text-slate-900">
                Sampling and design geography
              </h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              EICV7 is part of AHS 2024 sampling-frame and design context; it
              is not an agricultural observation dataset. AHS sampling
              information is not used to expand national summary results into
              district observations.
            </p>
          </article>
        </div>
      </MethodologySection>

      <MethodologySection
        id="signal-method-heading"
        intro="Each step keeps the source observation separate from the calculation and the possible decision it informs."
        title="How the district signal is made"
      >
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {signalSteps.map((step) => (
            <li
              className="rounded-xl border border-slate-200 bg-white p-4"
              key={step.number}
            >
              <span className="font-mono text-xs font-medium text-green-800">
                {step.number}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </MethodologySection>

      <MethodologySection
        id="status-heading"
        intro="Status labels describe how each displayed value was obtained."
        title="Observed, derived, and unavailable values"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-green-800">Observed</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Reported by NISR in a cited table, such as district yield,
              cultivated area, production, or irrigation practice.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-blue-800">Derived</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Calculated from observed values. AII labels the yield gap and
              comparison differences as derived and shows their formula or
              reference.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Unavailable</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A source value is not connected for the selected place, crop,
              season, or year. AII does not fill gaps with a national value or a
              test fixture.
            </p>
          </article>
        </div>
      </MethodologySection>

      <MethodologySection
        id="limitations-heading"
        intro="AII is a decision-support screen for investigation. It does not establish causes or estimate intervention impact."
        title="Limitations"
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            'SAS 2024 and SAS 2025 remain separate datasets for 2023/24 and 2024/25. AII does not calculate trends across them.',
            'Crop columns differ by season in the reports. A crop without an observed row in a selected period remains unavailable.',
            'AHS 2024 uses an annual 2023/24 reference period without SAS seasons. Its connected records preserve table populations and province or national geography; no AHS district observations are connected.',
            'AHS crop-specific improved-seed percentages describe crop-growing households and are not crop yield or production values.',
            'AHS irrigation techniques, water sources, and plot reasons retain each table’s household or plot denominator. They are not merged with SAS farmer-practice percentages.',
            'District-wide irrigation practice covers agricultural activity across crops. It is not maize-specific or linked to the farmers represented by the yield estimate.',
            'A yield gap does not identify its cause. The irrigation screen is a same-period comparison for investigation, not evidence of causality or predicted impact.',
            'Soil/environment evidence covers reported practices and erosion-control methods, not soil quality or erosion outcomes. Post-harvest handling/storage appears as an AHS extension-service category; loss rates, storage capacity, processing, credit access, and export indicators are not connected.',
            'AHS livestock evidence is ownership share by species. Livestock product volumes such as milk, meat, eggs, or honey are not connected.',
          ].map((limitation) => (
            <li
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600"
              key={limitation}
            >
              {limitation}
            </li>
          ))}
        </ul>
      </MethodologySection>
    </div>
  )
}
