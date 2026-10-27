// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DistrictSearchInput } from './DistrictSearchInput'

describe('DistrictSearchInput', () => {
  it('shows one clear action only for a populated search and supports searching again', async () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    const { rerender } = render(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value=""
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Search district' })
    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.queryByRole('button', { name: 'Clear district search' }),
    ).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Kayo' } })
    rerender(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value="Kayo"
      />,
    )

    expect(screen.getByRole('option', { name: 'Kayonza' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Clear district search' }),
    ).toHaveLength(1)

    fireEvent.click(
      screen.getByRole('button', { name: 'Clear district search' }),
    )
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onSelect).toHaveBeenLastCalledWith('')
    rerender(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value=""
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Clear district search' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await waitFor(() => expect(input).toHaveFocus())

    fireEvent.change(input, { target: { value: 'Nya' } })
    rerender(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value="Nya"
      />,
    )
    expect(
      screen.getByRole('option', { name: 'Nyarugenge' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Clear district search' }),
    ).toHaveLength(1)
  })
})
