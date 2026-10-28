// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AgriculturalOpportunityExplorer } from './AgriculturalOpportunityExplorer'

describe('AgriculturalOpportunityExplorer', () => {
  it('navigates to the district profile and both source evidence records', () => {
    const onOpenDistrictProfile = vi.fn()
    const onOpenEvidence = vi.fn()

    render(
      <AgriculturalOpportunityExplorer
        crop="maize"
        season="A"
        year="2024-25"
        selectedDistrict="Gasabo"
        onOpenDistrictProfile={onOpenDistrictProfile}
        onOpenEvidence={onOpenEvidence}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Agricultural Opportunity Explorer' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Observed district yield'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Observed national reference'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Calculated difference · district minus national'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Open profile for Gasabo/i }),
    )
    expect(onOpenDistrictProfile).toHaveBeenCalledWith('Gasabo')

    fireEvent.click(
      screen.getByRole('button', { name: /Review opportunity evidence for Gasabo/i }),
    )
    expect(onOpenEvidence).toHaveBeenCalledWith(
      'Gasabo',
      [
        'sas-2025-season-a-gasabo-average_yield',
        'sas-2025-season-a-rwanda-average_yield',
      ],
    )
  })
})
