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
          features: [{ properties: { district: 'Kayonza' } }],
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
    expect(screen.getByRole('region', { name: 'Rwanda district map' })).toBeInTheDocument()
    expect(screen.queryByText('481,246 tonnes')).not.toBeInTheDocument()
  })

  it('opens a district profile from keyboard district search', async () => {
    render(<App />)

    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Kayonza' } })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Kayonza' })).toBeInTheDocument()
    })

    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(
      screen.getByRole('heading', { name: 'Intervention signal' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open district profile' }))

    expect(screen.getByRole('heading', { name: 'Kayonza' })).toBeInTheDocument()
    expect(screen.queryByText('Improved seed use')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Source and methodology' })).toBeInTheDocument()
  })
})
