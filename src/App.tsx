import { useState } from 'react'
import './App.css'
import { dataContractStatus } from './types/data-contract'

const navigation = ['Overview', 'District profile', 'Evidence', 'Methodology'] as const
type NavigationItem = (typeof navigation)[number]

const pageCopy: Record<NavigationItem, { eyebrow: string; title: string; description: string }> = {
  Overview: {
    eyebrow: 'Decision support, grounded in evidence',
    title: 'See where agricultural productivity needs attention.',
    description:
      'Agricultural Intervention Intelligence will connect verified NISR statistics to geographically relevant, explainable intervention signals.',
  },
  'District profile': {
    eyebrow: 'District-first exploration',
    title: 'A clear profile for every supported geography.',
    description:
      'Productivity evidence and agricultural context will meet here once the verified source structures are inspected.',
  },
  Evidence: {
    eyebrow: 'Traceable statistics',
    title: 'Inspect the evidence behind every signal.',
    description:
      'Source references, table details, units, and geographic levels will remain visible alongside application-ready data.',
  },
  Methodology: {
    eyebrow: 'Transparent by design',
    title: 'Understand how the analysis will work.',
    description:
      'The methodology will document the datasets, geographic limits, calculations, and intervention logic after source validation.',
  },
}

function App() {
  const [activePage, setActivePage] = useState<NavigationItem>('Overview')
  const copy = pageCopy[activePage]

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f3ed] text-[#18312c]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#18312c]/15 py-6">
          <button className="flex items-center gap-3 text-left" onClick={() => setActivePage('Overview')} type="button">
            <span className="grid size-10 place-items-center rounded-full bg-[#d95d39] font-mono text-sm font-bold text-[#fdfbf5]">AI</span>
            <span>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d95d39]">NISR / TRACK 01</span>
              <span className="block font-display text-lg font-semibold tracking-tight">Agricultural Intervention Intelligence</span>
            </span>
          </button>
          <span className="hidden rounded-full border border-[#18312c]/20 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] sm:block">Foundation build</span>
        </header>

        <div className="grid flex-1 lg:grid-cols-[220px_1fr] lg:gap-16">
          <nav aria-label="Primary" className="flex gap-2 overflow-x-auto border-b border-[#18312c]/15 py-4 lg:block lg:border-b-0 lg:border-r lg:py-12 lg:pr-8">
            {navigation.map((item, index) => (
              <button
                className={`flex min-w-max items-center gap-3 rounded-full px-3 py-2 text-sm transition lg:mb-3 lg:w-full lg:rounded-none lg:px-0 ${activePage === item ? 'font-semibold text-[#d95d39] lg:border-r-2 lg:border-[#d95d39]' : 'text-[#18312c]/60 hover:text-[#18312c]'}`}
                key={item}
                onClick={() => setActivePage(item)}
                type="button"
              >
                <span className="font-mono text-[10px]">0{index + 1}</span>
                {item}
              </button>
            ))}
          </nav>

          <main className="py-12 lg:py-20">
            <section className="max-w-4xl animate-[rise-in_500ms_ease-out_both]">
              <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#d95d39]">{copy.eyebrow}</p>
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl">{copy.title}</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#18312c]/70">{copy.description}</p>
            </section>

            <section aria-labelledby="status-heading" className="mt-16 max-w-4xl border-t border-[#18312c]/20 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#18312c]/50">Current status</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold" id="status-heading">Waiting for verified source inspection</h2>
                </div>
                <span className="rounded-full bg-[#18312c] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#f5f3ed]">No observations loaded</span>
              </div>
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#18312c]/15 bg-[#18312c]/15 sm:grid-cols-3">
                {dataContractStatus.datasets.map((dataset) => (
                  <div className="bg-[#f5f3ed] p-5" key={dataset}>
                    <p className="font-mono text-xs text-[#18312c]/50">Dataset</p>
                    <p className="mt-2 font-semibold">{dataset}</p>
                    <p className="mt-6 text-sm text-[#18312c]/55">Source structure not yet inspected</p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[#18312c]/15 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#18312c]/50 sm:flex-row sm:items-center sm:justify-between">
          <span>Static frontend / explainable by default</span>
          <span>AHS + SAS source validation required before analysis</span>
        </footer>
      </div>
    </div>
  )
}

export default App
