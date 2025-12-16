import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { RoleDashboards } from './RoleDashboards'
import { useInsuranceStore } from '../lib/store'

function setVerifiedReceipt() {
  useInsuranceStore.setState({
    receipt: {
      merchant: 'Test Merchant',
      category: 'Electronics',
      items: [],
      total: 12.34,
      date: null,
      confidence: 0.4,
      eligibility: 'APPROVED',
      raw_text: null,

      pos_qr_verified: true,
      pos_qr_reason: 'ok',
      pos_qr_payload: {
        tenant_id: 'demo',
        transaction_id: 'tx_1',
        timestamp: 123,
        nonce: 'nonce_1',
        merchant_id: 'merchant_001',
        plan_id: 'plan_basic_12m',
        amount_cents: 1299,
        currency: 'USD',
      },

      trust_rating: 5,
      trust_confidence: 0.95,
    },
    policy: null,
    actorRole: null,
  } as any)
}

describe('RoleDashboards', () => {
  it('switches role views and reflects different fields', () => {
    setVerifiedReceipt()

    render(<RoleDashboards />)

    // Default is customer
    expect(screen.getByText(/Customer view/i)).toBeInTheDocument()
    expect(screen.getByText(/merchant:/i)).toBeInTheDocument()

    // Merchant view shows payload details
    fireEvent.click(screen.getByRole('button', { name: /select merchant dashboard/i }))
    expect(screen.getByText(/Merchant view/i)).toBeInTheDocument()
    expect(screen.getByText(/merchant_id:/i)).toBeInTheDocument()
    expect(screen.getByText(/merchant_001/i)).toBeInTheDocument()

    // Insurer view shows verification + trust
    fireEvent.click(screen.getByRole('button', { name: /select insurer dashboard/i }))
    expect(screen.getByText(/Insurer view/i)).toBeInTheDocument()
    expect(screen.getByText(/tenant_id:/i)).toBeInTheDocument()
    expect(screen.getByText(/demo/i)).toBeInTheDocument()
    expect(screen.getByText(/trust:/i)).toBeInTheDocument()
  })
})
