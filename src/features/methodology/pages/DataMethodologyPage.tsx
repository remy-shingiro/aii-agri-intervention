import { ArrowUpRight, BookOpenText, Calculator, MapPinned } from 'lucide-react'

import { MethodologySection } from '../components/MethodologySection'

const sourceCards = [
  {
    name: 'Agricultural Household Survey 2024',
    role: 'Primary agricultural context',
    period: 'Agricultural seasons A, B, and C of 2023/24',
    detail:
      'A household survey led by NISR. AHS findings describe agricultural households, production, practices, inputs, and services. It is the primary context for this product; its sample design is not used to manufacture district values.',
    href: 'https://www.statistics.gov.rw/data-sources/surveys/Agricultural-Household-Survey/agricultural-household-survey-2024',
  },
  {
    name: 'Seasonal Agricultural Survey 2024',
    role: 'Prior-year NISR publication',
    period: 'Agricultural year 2023/24 · Seasons A, B, and C',
    detail:
      'NISR published district tables for the 2023/24 agricultural year. Those historical district records are not connected to the current explorer, so AII does not display them as a trend yet.',
    href: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-02/SAS%202024%20Annual.pdf',
  },
  {
    name: 'Seasonal Agricultural Survey 2025',
    role: 'Current connected district evidence',
    period: 'Agricultural year 2024/25 · Season A',
    detail:
      'The Overview, Evidence explorer, and district productivity signal currently use reported district maize yield, cultivated area, production, and district-wide agricultural practice estimates from this annual report.',
    href: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf',
  },
] as const

const signalSteps = [
  {
    number: '01',
    title: 'District observation',
    text: 'Read the district maize yield reported in SAS 2025 Table 19. Production and cultivated area remain separate observed values from Tables 24 and 13.',
  },
  {
    number: '02',
    title: 'National reference',
    text: 'Use the national maize yield in the same table, season, and agricultural year as the comparison value.',
  },
  {
    number: '03',
    title: 'Yield gap',
    text: 'Calculate (district yield − national yield) ÷ national yield × 100. The percentage is derived; the two yield values are reported observations.',
  },
  {
    number: '04',
    title: 'Evidence assessment',
    text: 'Check whether same-period district evidence exists for a potential intervention area. The current irrigation screen compares Table 64 district and national practice estimates.',
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
            Primary dataset
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
            2023/24 · Seasons A, B, and C
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Connected productivity signal
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            SAS 2025 · Season A · 2024/25
          </p>
        </div>
      </div>

      <MethodologySection
        id="datasets-heading"
        intro="AHS supplies the primary agricultural household context. The current district productivity measures are transcribed from the cited SAS tables; these surveys have different roles and periods."
        title="NISR source register"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {sourceCards.map((source) => (
            <SourceCard key={source.name} {...source} />
          ))}
        </div>
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
              AII displays a district figure only when a NISR publication
              explicitly reports that indicator at district level. For the
              connected period, SAS 2025 Table 19 reports crop yields by
              district and nationally; Table 64 reports agricultural practices
              by district and nationally. National values remain national
              references.
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
              AHS 2024 selected 600 enumeration areas from the 1,674 EICV7
              enumeration areas, with district allocations based on agricultural
              household counts. EICV7 is part of AHS sampling design; it is not
              the agricultural dataset. Sampling context is not used to expand
              national AHS results into district observations.
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
            'District maize yield, area, production, and practice records are currently connected only for Season A 2024/25.',
            'NISR SAS 2024 district tables are published, but historical district records are not connected here; AII therefore does not show a time trend.',
            'Other crop and season combinations show unavailable states until their matching source records are connected.',
            'AHS sample coverage and EICV7 design context do not create district-level AHS estimates in this product.',
            'District-wide irrigation practice covers agricultural activity across crops. It is not specific to maize or to the farmers represented by the yield estimate.',
            'A yield gap does not identify its cause. The irrigation screen is a same-period comparison for field investigation, not evidence of causality or predicted impact.',
            'Evidence for soil fertility, post-harvest storage, processing, value addition, and export opportunities is not connected to the current district signal.',
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
