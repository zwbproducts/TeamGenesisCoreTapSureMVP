import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /tapsure/i })).toBeInTheDocument()
  })
})
