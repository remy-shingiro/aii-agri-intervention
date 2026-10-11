// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { evidenceRecords } from './features/evidence/data/evidenceRecords'
import { calculateNationalIntelligence } from './features/intelligence/nationalIntelligence'

vi.mock('./features/overview/components/RwandaMapPanel', () => ({
  RwandaMapPanel: () => <div aria-label="Rwanda district map" role="region" />,
}))

const lazyLoadWait = { timeout: 10_000 }

describe('application shell', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            { properties: { district: 'Kayonza' } },
            { properties: { district: 'Nyarugenge' } },
          ],
        }),
      }),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the Overview with filter context and the district map', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Rwanda Agricultural Overview' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Crop')).toHaveValue('maize')
    expect(screen.getByLabelText('Season')).toHaveValue('season-a')
    expect(screen.getByLabelText('Year')).toHaveValue('2024-25')
    expect(
      await screen.findByRole(
        'region',
        { name: 'Rwanda district map' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'National Agricultural Intelligence' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('481,246 tonnes')).not.toBeInTheDocument()
  })

  it('keeps the national scope when searching a district and follows crop filters', async () => {
    render(<App />)

    const districtsAnalyzedCard = screen
      .getByRole('heading', { name: 'Districts analyzed' })
      .closest('article')
    expect(districtsAnalyzedCard).not.toBeNull()
    if (!districtsAnalyzedCard) return

    const initialCardText = districtsAnalyzedCard.textContent
    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Nyarugenge' } })
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Nyarugenge' }),
      ).toBeInTheDocument()
    })
    expect(districtsAnalyzedCard).toHaveTextContent(initialCardText ?? '')

    const sorghumSummary = calculateNationalIntelligence(evidenceRecords, {
      crop: 'sorghum',
      season: 'A',
      year: '2024/25',
    })
    fireEvent.change(screen.getByLabelText('Crop'), {
      target: { value: 'sorghum' },
    })

    expect(districtsAnalyzedCard).toHaveTextContent(
      `of ${sorghumSummary.districtsInScope} districts with selected-period yield records`,
    )
    expect(districtsAnalyzedCard).toHaveTextContent(
      `${sorghumSummary.insufficientEvidenceCount} lack a comparable reference`,
    )
    expect(
      within(districtsAnalyzedCard).getByText(
        String(sorghumSummary.districtsAnalyzed),
      ),
    ).toBeInTheDocument()
  })

  it('opens a district profile from keyboard district search', async () => {
    render(<App />)

    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Kayonza' } })

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Kayonza' }),
      ).toBeInTheDocument()
    })

    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(
      screen.getByRole('heading', { name: 'Productivity comparison' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Open district profile' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Kayonza' }, lazyLoadWait),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'District-wide seasonal practice profile',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Improved seed use' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Investigation Areas',
      }),
    ).toBeInTheDocument()
  })

  it('uses the selected crop and period on profiles and fails closed for gaps', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Crop'), {
      target: { value: 'beans' },
    })
    fireEvent.change(screen.getByLabelText('Season'), {
      target: { value: 'season-b' },
    })
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2023-24' },
    })

    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Nyarugenge' } })
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Nyarugenge' }),
      ).toBeInTheDocument()
    })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })
    fireEvent.click(
      screen.getByRole('button', { name: 'Open district profile' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Nyarugenge' }, lazyLoadWait),
    ).toBeInTheDocument()
    expect(screen.getByText(/Beans.*Season B.*2023\/24/)).toBeInTheDocument()
    expect(screen.getByText(/614 Kg\/Ha/)).toBeInTheDocument()
    expect(screen.getAllByText(/Table 17: 2024 Season B/)).toHaveLength(2)

    expect(
      screen.getByText('Selected period: 2023/24 · Season B'),
    ).toBeInTheDocument()
    const seedPractice = screen
      .getByRole('heading', { name: 'Improved seed use' })
      .closest('article')
    expect(seedPractice).not.toBeNull()
    if (!seedPractice) return
    expect(seedPractice).toHaveTextContent('District-wide practice · all crop activity')
    expect(within(seedPractice).getByText('15.3 %')).toBeInTheDocument()
    expect(within(seedPractice).getByText('18 %')).toBeInTheDocument()
    expect(
      within(seedPractice).getByText('-2.7 percentage points'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
    fireEvent.change(screen.getByLabelText('Crop'), {
      target: { value: 'sorghum' },
    })
    fireEvent.change(screen.getByLabelText('Season'), {
      target: { value: 'season-a' },
    })
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2024-25' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'District Profile' }))

    expect(
      await screen.findByRole(
        'heading',
        {
          name: 'Insufficient connected NISR evidence',
        },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/614 kg\/ha/)).not.toBeInTheDocument()
  })

  it('opens only the selected district and national practice records in Evidence Explorer', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Crop'), {
      target: { value: 'beans' },
    })
    fireEvent.change(screen.getByLabelText('Season'), {
      target: { value: 'season-b' },
    })
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2023-24' },
    })

    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Nyarugenge' } })
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Nyarugenge' })).toBeInTheDocument()
    })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Open district profile' }))

    expect(
      await screen.findByRole('heading', { name: 'Nyarugenge' }, lazyLoadWait),
    ).toBeInTheDocument()
    const practice = screen
      .getByRole('heading', { name: 'Improved seed use' })
      .closest('article')
    expect(practice).not.toBeNull()
    if (!practice) return

    fireEvent.click(
      within(practice).getByRole('button', {
        name: 'View provenance in Evidence Explorer',
      }),
    )
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Evidence explorer' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('2 records')).toBeInTheDocument()
    expect(screen.getByLabelText('Crop')).toHaveValue('all')
    expect(
      screen.getAllByRole('link', { name: /Table 31: 2024 Season B/ }),
    ).toHaveLength(2)
    const districtEvidenceCard = screen
      .getByRole('heading', { name: 'Nyarugenge' })
      .closest('article')
    expect(districtEvidenceCard).not.toBeNull()
    if (!districtEvidenceCard) return
    expect(
      within(districtEvidenceCard).getByText(/All crop activity/),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Rwanda' })).toBeInTheDocument()
  })

  it('opens the Evidence explorer and shows connected SAS 2024 observations', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Evidence' }))

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Evidence explorer' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('31 records')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Agricultural year'), {
      target: { value: '2023/24' },
    })

    expect(screen.getAllByText('SAS 2024').length).toBeGreaterThan(0)
    expect(screen.getByText('31 records')).toBeInTheDocument()
  })

  it('opens the Data & Methodology destination', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Data & Methodology' }))

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Data & Methodology' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /EICV7 is part of AHS 2024 sampling-frame and design context/,
      ),
    ).toBeInTheDocument()
  })

  it('connects a supported intervention signal to its evidence records', async () => {
    render(<App />)

    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Nyarugenge' } })
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Nyarugenge' }),
      ).toBeInTheDocument()
    })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })
    fireEvent.click(
      screen.getByRole('button', { name: 'Open district profile' }),
    )

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Irrigation investigation' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Investigation signal')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Why this signal?' }),
    )

    expect(
      await screen.findByRole(
        'heading',
        {
          name: 'Irrigation investigation signal',
        },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/1,338 Kg\/Ha/)).toHaveLength(2)
    expect(screen.getAllByText(/1,985 Kg\/Ha/)).toHaveLength(2)
    expect(screen.getAllByText(/-647 Kg\/Ha/)).toHaveLength(2)
    expect(screen.getByText(/8\.5 %/)).toBeInTheDocument()
    expect(screen.getByText(/13\.4 %/)).toBeInTheDocument()
    expect(screen.getByText(/-4\.9 percentage points/)).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', {
          name: 'District-wide irrigation comparison',
        }),
      ).getAllByRole('link'),
    ).toHaveLength(2)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Evidence Explorer' }),
    )
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Evidence explorer' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('District')).toHaveValue('Nyarugenge')
    expect(screen.getByText('4 records')).toBeInTheDocument()
    expect(
      screen.getByText(/Supporting evidence · Irrigation investigation signal/),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'District Profile' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Why this signal?' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'View Methodology' }))
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Data & Methodology' },
        lazyLoadWait,
      ),
    ).toBeInTheDocument()
  })
})
