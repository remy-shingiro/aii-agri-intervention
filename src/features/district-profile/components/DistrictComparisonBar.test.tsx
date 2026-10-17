// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DistrictComparisonBar } from './DistrictComparisonBar'

describe('DistrictComparisonBar', () => {
  it('shows observed district and national values with the supplied signed difference', () => {
    const { container } = render(
      <DistrictComparisonBar
        difference={-647}
        districtName="Nyarugenge"
        districtValue={1338}
        label="Maize yield"
        nationalValue={1985}
        unit="Kg/Ha"
      />,
    )

    expect(screen.getByText('1,338 Kg/Ha')).toBeInTheDocument()
    expect(screen.getByText('1,985 Kg/Ha')).toBeInTheDocument()
    expect(screen.getByText('-647 Kg/Ha')).toBeInTheDocument()
    expect(container.querySelector('[data-series="district"]')).toHaveStyle({
      width: '67.41%',
    })
    expect(container.querySelector('[data-series="national"]')).toHaveStyle({
      width: '100%',
    })
  })

  it('uses a fixed shared scale for percentages', () => {
    const { container } = render(
      <DistrictComparisonBar
        difference={-2.7}
        differenceUnit="percentage points"
        districtName="Kayonza"
        districtValue={15.3}
        label="Improved seed use"
        nationalValue={18}
        scaleMaximum={100}
        unit="%"
      />,
    )

    expect(container.querySelector('[data-series="district"]')).toHaveStyle({
      width: '15.3%',
    })
    expect(container.querySelector('[data-series="national"]')).toHaveStyle({
      width: '18%',
    })
    expect(screen.getByText('-2.7 percentage points')).toBeInTheDocument()
    expect(screen.getByText('Shared bar scale: 0 to 100 %')).toBeInTheDocument()
  })

  it('keeps partial and unavailable observations textual without drawing bars', () => {
    const { container } = render(
      <DistrictComparisonBar
        districtName="Nyarugenge"
        districtValue={0}
        label="Mechanical equipment use"
        unit="%"
      />,
    )

    expect(screen.getByText('0 %')).toBeInTheDocument()
    expect(screen.getAllByText('Unavailable')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent(
      /needs observed, comparable district and national values/,
    )
    expect(container.querySelector('[data-series]')).toBeNull()
  })
})
