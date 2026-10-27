// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import { DistrictYieldHistoryChart } from './DistrictYieldHistoryChart'
import { getDistrictYieldHistory } from '../utils/districtYieldHistory'

describe('DistrictYieldHistoryChart', () => {
  it('selects compatible observed district yields through the selected year', () => {
    const selection = getDistrictYieldHistory(
      evidenceRecords,
      'Nyarugenge',
      'maize',
      'A',
      '2024-25',
    )

    expect(selection.status).toBe('available')
    if (selection.status !== 'available') return

    expect(
      selection.records.map((record) => [record.period.year, record.value]),
    ).toEqual([
      ['2023/24', 1390],
      ['2024/25', 1338],
    ])
    expect(
      selection.records.every(
        (record) =>
          record.geography.level === 'district' &&
          record.geography.name === 'Nyarugenge' &&
          record.indicator === 'average_yield' &&
          record.unit === 'Kg/Ha' &&
          record.status === 'observed',
      ),
    ).toBe(true)
  })

  it('shows labeled horizontal bars, reported values, and source links', () => {
    const { rerender } = render(
      <DistrictYieldHistoryChart
        crop="maize"
        district="Nyarugenge"
        season="A"
        year="2024-25"
      />,
    )

    const history = screen.getByRole('list', {
      name: 'Reported yield by agricultural year',
    })
    const periods = within(history).getAllByRole('listitem')
    expect(periods).toHaveLength(2)
    expect(within(periods[0]).getByText('2023/24')).toBeInTheDocument()
    expect(within(periods[0]).getByText('1,390 Kg/Ha')).toBeInTheDocument()
    expect(within(periods[1]).getByText('2024/25')).toBeInTheDocument()
    expect(within(periods[1]).getByText('1,338 Kg/Ha')).toBeInTheDocument()
    expect(screen.getByText(/shared scale ends at 1,390 Kg\/Ha/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /SAS 2025.*Table 19/ }),
    ).toHaveAttribute('href', expect.stringContaining('statistics.gov.rw'))

    rerender(
      <DistrictYieldHistoryChart
        crop="maize"
        district="Nyarugenge"
        season="A"
        year="2023-24"
      />,
    )

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Insufficient comparable periods',
    )
    expect(screen.getByText(/through 2023\/24/)).toBeInTheDocument()
  })

  it('withholds chart values for unavailable and invalid yield observations', () => {
    const unavailable = getDistrictYieldHistory(
      evidenceRecords,
      'Nyarugenge',
      'Sorghum',
      'A',
      '2024/25',
    )
    expect(unavailable.status).toBe('insufficient')

    const selectedHistory = getDistrictYieldHistory(
      evidenceRecords,
      'Nyarugenge',
      'Maize',
      'A',
      '2024/25',
    )
    expect(selectedHistory.status).toBe('available')
    if (selectedHistory.status !== 'available') return
    const currentMaize = selectedHistory.records.at(-1)
    expect(currentMaize).toBeDefined()
    if (!currentMaize) return

    const withInvalidYield = evidenceRecords.map((record) =>
      record.id === currentMaize.id ? { ...record, value: -1 } : record,
    )
    const invalid = getDistrictYieldHistory(
      withInvalidYield,
      'Nyarugenge',
      'Maize',
      'A',
      '2024/25',
    )

    expect(invalid).toMatchObject({ status: 'invalid' })
  })
})
