// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./features/overview/components/RwandaMapPanel', () => ({
  RwandaMapPanel: () => <div aria-label="Rwanda district map" role="region" />,
}))

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

  it('shows the Overview with filter context and the district map', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Rwanda Agricultural Overview' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Crop')).toHaveValue('maize')
    expect(screen.getByLabelText('Season')).toHaveValue('season-a')
    expect(screen.getByLabelText('Year')).toHaveValue('2024-25')
    expect(
      screen.getByRole('region', { name: 'Rwanda district map' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('481,246 tonnes')).not.toBeInTheDocument()
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

    expect(screen.getByRole('heading', { name: 'Kayonza' })).toBeInTheDocument()
    expect(screen.queryByText('Improved seed use')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Potential Intervention Areas',
      }),
    ).toBeInTheDocument()
  })

  it('uses the selected crop and period on profiles and shows exact gaps', async () => {
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

    expect(screen.getByRole('heading', { name: 'Nyarugenge' })).toBeInTheDocument()
    expect(screen.getByText(/Beans.*Season B.*2023\/24/)).toBeInTheDocument()
    expect(screen.getByText(/614 kg\/ha/)).toBeInTheDocument()
    expect(screen.getByText(/Table 17: 2024 Season B/)).toBeInTheDocument()

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
      screen.getByRole('heading', {
        name: 'No connected district observations for this period',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/614 kg\/ha/)).not.toBeInTheDocument()
  })

  it('opens the Evidence explorer and shows connected SAS 2024 observations', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Evidence' }))

    expect(
      screen.getByRole('heading', { name: 'Evidence explorer' }),
    ).toBeInTheDocument()
    expect(screen.getByText('31 records')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Agricultural year'), {
      target: { value: '2023/24' },
    })

    expect(screen.getAllByText('SAS 2024').length).toBeGreaterThan(0)
    expect(screen.getByText('31 records')).toBeInTheDocument()
  })

  it('opens the Data & Methodology destination', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Data & Methodology' }))

    expect(
      screen.getByRole('heading', { name: 'Data & Methodology' }),
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

    expect(screen.getByRole('heading', { name: 'Irrigation' })).toBeInTheDocument()
    expect(screen.getByText('Investigation signal')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Why this signal?' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Irrigation investigation signal' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/1,338 Kg\/Ha/)).toBeInTheDocument()
    expect(screen.getByText(/1,985 Kg\/Ha/)).toBeInTheDocument()
    expect(screen.getByText(/-647 Kg\/Ha/)).toBeInTheDocument()
    expect(screen.getByText(/8\.5 %/)).toBeInTheDocument()
    expect(screen.getByText(/13\.4 %/)).toBeInTheDocument()
    expect(screen.getByText(/-4\.9 percentage points/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Open NISR source' })).toHaveLength(4)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Evidence Explorer' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Evidence explorer' }),
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
      screen.getByRole('heading', { name: 'Data & Methodology' }),
    ).toBeInTheDocument()
  })
})
