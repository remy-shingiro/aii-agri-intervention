// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EvidenceStatusBadge } from './EvidenceStatusBadge'

describe('EvidenceStatusBadge', () => {
  it.each(['observed', 'derived', 'unavailable'] as const)(
    'keeps the %s state understandable with text and an icon',
    (status) => {
      const label = status[0].toUpperCase() + status.slice(1)
      render(<EvidenceStatusBadge status={status} />)

      expect(screen.getByText(label)).toBeInTheDocument()
      expect(document.querySelector('svg')).toBeInTheDocument()
    },
  )
})
