// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DataMethodologyPage } from './DataMethodologyPage'

describe('DataMethodologyPage', () => {
  it('shows status distributions with connected-record denominators', () => {
    render(<DataMethodologyPage />)

    const charts = screen.getAllByRole('img')
    expect(charts).toHaveLength(3)
    expect(charts[0]).toHaveAccessibleName(
      /observed, .* derived, and .* unavailable connected records out of .* normalized records/,
    )
    expect(
      screen.getAllByText(
        'Record status share · denominator: normalized records',
      ),
    ).toHaveLength(3)
    expect(
      screen.getByText(/report tables are catalogued but not cell-extracted/),
    ).toBeInTheDocument()
  })
})
