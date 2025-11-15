import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import BillingDashboard, { BillingPlan, Invoice, UsageMetric } from '@/components/white-label/billing-dashboard'

describe('BillingDashboard', () => {
  const mockCurrentPlan: BillingPlan = {
    id: 'plan-pro',
    name: 'Pro',
    tier: 'pro',
    price: 99,
    interval: 'monthly',
    features: ['Unlimited users', 'Advanced analytics', 'Priority support'],
  }

  const mockUsageMetrics: UsageMetric[] = [
    {
      name: 'API Requests',
      current: 7500,
      limit: 10000,
      unit: 'requests',
    },
    {
      name: 'Storage',
      current: 45,
      limit: 100,
      unit: 'GB',
    },
  ]

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      number: 'INV-001',
      date: '2024-01-01',
      dueDate: '2024-01-15',
      amount: 99.0,
      status: 'paid',
    },
  ]

  const mockOnChangePlan = jest.fn()
  const mockOnDownloadInvoice = jest.fn()

  const defaultProps = {
    tenantId: 'tenant-123',
    currentPlan: mockCurrentPlan,
    availablePlans: [mockCurrentPlan],
    usageMetrics: mockUsageMetrics,
    invoices: mockInvoices,
    nextBillingDate: '2024-02-01',
    onChangePlan: mockOnChangePlan,
    onDownloadInvoice: mockOnDownloadInvoice,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders billing dashboard header', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('Billing Dashboard')).toBeTruthy()
  })

  it('displays current plan name', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('Pro')).toBeTruthy()
  })

  it('shows current plan price', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('$99')).toBeTruthy()
  })

  it('displays plan features', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('Unlimited users')).toBeTruthy()
    expect(screen.getByText('Advanced analytics')).toBeTruthy()
  })

  it('shows usage metrics', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('API Requests')).toBeTruthy()
    expect(screen.getByText('Storage')).toBeTruthy()
  })

  it('displays usage progress bars', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText(/7,500 \/ 10,000 requests/)).toBeTruthy()
    expect(screen.getByText(/45 \/ 100 GB/)).toBeTruthy()
  })

  it('shows billing history section', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('Billing History')).toBeTruthy()
  })

  it('displays invoice information', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText('INV-001')).toBeTruthy()
    expect(screen.getByText('Paid')).toBeTruthy()
  })

  it('calls onDownloadInvoice when download clicked', () => {
    render(<BillingDashboard {...defaultProps} />)
    const downloadButton = screen.getByText('Download')
    fireEvent.click(downloadButton)

    expect(mockOnDownloadInvoice).toHaveBeenCalledWith('inv-1')
  })

  it('displays next billing date', () => {
    render(<BillingDashboard {...defaultProps} />)
    expect(screen.getByText(/Next billing date/)).toBeTruthy()
  })
})
