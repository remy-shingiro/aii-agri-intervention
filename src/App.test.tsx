import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application shell', () => {
  it('shows the verified-data waiting state', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /see where agricultural productivity/i })).toBeInTheDocument()
    expect(screen.getByText('AHS 2024')).toBeInTheDocument()
    expect(screen.getByText('No observations loaded')).toBeInTheDocument()
  })

  it('switches between foundation screens without inventing observations', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /evidence/i }))

    expect(screen.getByRole('heading', { name: /inspect the evidence/i })).toBeInTheDocument()
    expect(screen.getAllByText('Source structure not yet inspected')).toHaveLength(3)
  })
})
