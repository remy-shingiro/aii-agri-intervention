# Agricultural Intervention Intelligence (AII)

Agricultural Intervention Intelligence (AII) is a frontend decision-support prototype for exploring Rwanda’s agricultural productivity evidence ahead of the NISR Rwanda Big Data Hackathon 2026. It connects selected district and national observations from NISR’s Seasonal Agricultural Survey (SAS) and Agricultural Household Survey (AHS), shows comparable differences and investigation signals, and keeps source references available so users can inspect the evidence behind a finding.

- **Live application:** (https://chimerical-baklava-1c81b6.netlify.app/)
- **Repository:** [github.com/remy-shingiro/aii-agri-intervention](https://github.com/remy-shingiro/aii-agri-intervention) (from the configured Git remote; public accessibility has not been verified).
- **Hackathon:** [NISR 2026 Big Data Hackathon](https://www.alpha.statistics.gov.rw/about/hackathon/2026-hackathon-competition)

## Problem and intended use

Agricultural planners need geographically comparable, period-specific evidence to see where productivity differs from a national reference and decide what merits further investigation. Published survey tables can be difficult to compare across crops, seasons, indicators, and source reports. AII brings selected observations into one interface while retaining their source context.

AII supports **exploratory review and question formation**. It does not determine why a difference exists, establish intervention impact, or predict future outcomes.

## How to use AII

1. Choose a crop, season, agricultural year, and district from the Overview controls and Rwanda district map.
2. Review available district evidence and any comparison with the matching national reference. The map and insight panels reflect the selected scope.
3. Open the District Profile to review crop yield, cultivated area and production comparisons, district-wide practice indicators, and supporting records.
4. Open the Evidence Explorer to inspect records, status, units, report references, and source links. The Data & Methodology page explains coverage and interpretation.
5. Open the Investigation Brief for the selected district and scope. It presents the supported signals, evidence, and questions for follow-up; it can be printed or saved as a PDF.

## Implemented features

- Rwanda district map with district selection and linked insight panels.
- Overview filters for crop, season, agricultural year, and district search.
- National intelligence summaries for productivity gaps, productivity direction, and irrigation investigation signals.
- District crop portfolio and district-versus-national comparisons for yield, cultivated area, and production where matching observations are available.
- Grouped district-wide seasonal practice comparisons, with evidence trails.
- Evidence Explorer with search/filtering and source-linked observation records.
- Investigation Brief with selected signals, source records, and print support.
- Data & Methodology view with dataset coverage, inventory status, and interpretation limitations.

The application currently exposes five destinations: Overview, District Profile, Evidence, Data & Methodology, and Investigation Brief.

## Data sources and repository coverage

The repository contains these processed observations. Report year and agricultural reference period are separate: for example, SAS 2025 reports the 2024/25 agricultural year.

| Dataset | Report year | Agricultural reference period | Records connected to AII | Geography in connected records | Periods |
| --- | ---: | --- | ---: | --- | --- |
| SAS 2024 | 2024 | 2023/24 | 5,859 (5,124 observed; 735 unavailable) | 30 districts and Rwanda national | Seasons A, B, C |
| SAS 2025 | 2025 | 2024/25 | 5,859 (5,120 observed; 739 unavailable) | 30 districts and Rwanda national | Seasons A, B, C |
| AHS 2024 | 2024 | 2023/24 | 566 (529 observed; 37 unavailable) | Rwanda national and five provinces; no district observations | Seasons A, B, C where reported; some tables have no season |

Counts above were checked against `data/processed/agricultural-observations.json`. SAS records span 24 referenced tables per report; AHS observations span 13. These are repository/application records, not a claim that every table cell in the reports is connected or has been independently checked against its PDF.

`data/processed/agricultural-data-inventory.json` contains 12,337 inventory entries: 10,773 marked `extracted`, 1,511 marked `unavailable`, and 53 marked `catalogued_not_connected`. Inventory entries describe table/cell extraction coverage; they are not the same thing as the normalized observation count. A catalogued table is not necessarily available as an observation in the application.

“Unavailable” means the connected source did not provide a usable value for that observation, such as a dash in a table. AII retains that status instead of substituting zero. A missing crop/season column is not evidence that the underlying activity was absent. AHS values remain national or provincial; AII does not derive district-level AHS estimates.

Original reports are stored under `data/raw/` and linked in `data/metadata/sources.json`:

- [SAS 2024 Annual Report (NISR PDF)](https://www.statistics.gov.rw/sites/default/files/documents/2025-02/SAS%202024%20Annual.pdf)
- [SAS 2025 Final Report (NISR PDF)](https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf)
- [AHS 2024 Main Report (NISR PDF)](https://www.statistics.gov.rw/sites/default/files/documents/2025-10/AHS%202024_Main%20report.pdf)

## Methodology and evidence

### Comparable observations

District-to-national comparisons require observed, finite values at district and national geography and matching dataset, indicator, crop, species, category, agricultural year, season, period label, and unit. The absolute difference is calculated as:

```text
district value − national value
```

For percentage indicators, the difference is expressed in percentage points. The relative yield gap is derived as `(district yield − national yield) / national yield × 100`; it is only calculated when a comparable observed national yield is greater than zero. Cultivated area, production, and yield are kept as separate indicators and units.

### Investigation signals

- **Productivity gap:** compares observed district and national yields for the same crop and period. It reports the signed absolute difference and relative difference; it does not explain the cause.
- **Productivity direction:** compares the earliest and latest available comparable observed district yields for the same crop and season across agricultural years. It requires at least two comparable periods and is not a statistical significance test or forecast.
- **Irrigation investigation:** the current signal requires maize yield evidence plus comparable same-period district-wide and national irrigation-practice evidence. It is supported when both district maize yield and the district-wide irrigation measure are below their respective national references. The practice measure covers crop activity across the district; it is not a maize-specific measure and does not establish a causal link.

If necessary evidence is missing, unavailable, or ambiguous, signal generation reports insufficient evidence rather than treating missing values as zero. Source records retain dataset, report, source URL, table, and page references where supplied by the extraction workflow. These references help users trace a finding to the report, but are not a substitute for checking the original table.

### Current source verification status

An independent pilot selected 18 candidate records across both SAS reports, three geographies, two seasons, yield, cultivated area, and irrigation practice. **Zero source cells were independently verified** because the local PDF rendering attempt failed. The audit ledger marks all 18 candidates `not_checked`; the pilot did not establish either matches or errors. See `artifacts/source-reconciliation-pilot/REPORT.md` and `artifacts/source-reconciliation-pilot/ledger.json`. Do not interpret repository coverage or application tests as comprehensive reconciliation to the original PDFs.

## Limitations and responsible interpretation

| Limitation | How to interpret it |
| --- | --- |
| District and national observations are descriptive comparisons | A gap is not a causal effect, validated intervention impact, or proof that one condition produced another. |
| Signal rules are screening logic | Signals identify evidence patterns worth investigating; they are not recommendations, significance tests, or guaranteed forecasts. |
| AHS 2024 has no district-level observations in the connected dataset | AHS national and provincial records cannot support district-level conclusions. |
| Unavailable cells and absent columns remain unknown | They are not zero and do not show that an agricultural activity did not occur. |
| NISR source reconciliation is incomplete | The current SAS pilot has no independently verified PDF cells; verify report values before relying on them for high-stakes decisions. |
| Some report tables are inventory-only | `catalogued_not_connected` entries are not presented as application observations. |

## Technology and architecture

- React 19, TypeScript 6, and Vite 8.
- Tailwind CSS 4, Lucide React icons, and MapLibre GL JS for the district map.
- Static processed JSON observations and inventory loaded by the browser; no application backend or database is configured.
- Feature code is grouped under `src/features/`: overview, district profile, evidence, intelligence, investigation brief, and methodology. Shared application shell and navigation are under `src/components/`.
- Source reports, processed data, source metadata, and extraction code are kept under `data/` and `scripts/`.

## Getting started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` (the engine requirement of the installed Vite version).
- npm, included with Node.js.

### Install and run

```sh
npm ci
npm run dev
```

Vite prints the local development URL in the terminal.

### Project scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run test` | Run the Vitest test suite once. |
| `npm run typecheck` | Run TypeScript project checks (`tsc -b`). |
| `npm run lint` | Run ESLint. |
| `npm run build` | Typecheck and create the production build in `dist/`. |
| `npm run preview` | Serve the most recent production build locally. |
| `npm run extract:nisr` | Regenerate processed observations, inventory, and source metadata from the original PDFs. This writes generated data files; review the changes before keeping them. |
| `npm run format` | Run Prettier in write mode across the repository. This modifies files. |

## Extraction and provenance

The checked-in extraction script is `scripts/extract-nisr-agricultural-data.cjs`. It expects these source PDFs at the listed paths:

- `data/raw/SAS/SAS 2024 Annual.pdf`
- `data/raw/SAS/SAS 2025 Final report.pdf`
- `data/raw/AHS/AHS 2024_Main report.pdf`

`npm run extract:nisr` reads those reports and rewrites `data/processed/agricultural-observations.json`, `data/processed/agricultural-data-inventory.json`, and `data/metadata/sources.json`. It is a data regeneration command, not a validation-only or dry-run command. Review generated diffs and reconcile report values before accepting regenerated data. Each connected observation retains a source report and table/page reference where available; original source links are recorded in `data/metadata/sources.json`.

## Project status and next steps

**Implemented:** map-led exploration, district profiles, evidence browsing, source-linked records, comparison and investigation signals, methodology, and a printable investigation brief.

**Outstanding:** independently reconcile the extracted SAS observations against the original report tables, improve reproducible PDF rendering for that audit, and add verified public deployment details. Do not treat the current extraction inventory or automated tests as proof of comprehensive source accuracy.

## Acknowledgements and AI disclosure

Agricultural statistics are sourced from the National Institute of Statistics of Rwanda (NISR); report links are listed above. The project has been developed with AI assistance, including README preparation. The team remains responsible for reviewing the code and data, acknowledging sources, and making the complete AI-use disclosure required by the [NISR hackathon rules](https://www.alpha.statistics.gov.rw/about/hackathon/2026-hackathon-competition). This README does not certify team eligibility, registration, or the team's final declaration.
