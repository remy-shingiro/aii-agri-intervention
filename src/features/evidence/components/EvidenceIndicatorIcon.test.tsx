// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EvidenceIndicatorIcon } from './EvidenceIndicatorIcon'

describe('EvidenceIndicatorIcon', () => {
  it.each([
    ['average_yield', 'sprout'],
    ['crop_production', 'production'],
    ['cultivated_area', 'land-plot'],
    ['irrigation_practice', 'droplets'],
    ['mechanical_equipment_use', 'tractor'],
    ['beekeeping', 'bug'],
    ['livestock_ownership', 'paw-print'],
  ] as const)(
    'uses the %s topic icon without implying a crop species',
    (indicator, icon) => {
      const { container } = render(
        <EvidenceIndicatorIcon indicator={indicator} />,
      )

      expect(
        container.querySelector(`[data-icon="${icon}"]`),
      ).toBeInTheDocument()
      expect(container.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
    },
  )
})
