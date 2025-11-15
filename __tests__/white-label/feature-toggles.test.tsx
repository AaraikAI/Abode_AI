import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FeatureToggles, { Feature } from '@/components/white-label/feature-toggles'

describe('FeatureToggles', () => {
  const mockFeatures: Feature[] = [
    {
      id: 'feature-1',
      name: 'Advanced Analytics',
      description: 'Access advanced analytics and reporting',
      category: 'advanced',
      enabled: true,
      requiredPlan: 'pro',
      usageCount: 150,
      limits: {
        enabled: true,
        maxRequests: 1000,
        rateLimit: 100,
      },
    },
    {
      id: 'feature-2',
      name: 'API Access',
      description: 'Programmatic API access',
      category: 'core',
      enabled: false,
      requiredPlan: 'starter',
      usageCount: 0,
    },
  ]

  const mockOnSave = jest.fn()
  const mockOnFeatureToggle = jest.fn()

  const defaultProps = {
    tenantId: 'tenant-123',
    tenantPlan: 'pro' as const,
    features: mockFeatures,
    onSave: mockOnSave,
    onFeatureToggle: mockOnFeatureToggle,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders feature toggles header', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByText('Feature Toggles')).toBeTruthy()
  })

  it('displays active features count', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByText('1 / 2')).toBeTruthy()
  })

  it('shows search input', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByPlaceholderText('Search features...')).toBeTruthy()
  })

  it('displays all features', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByText('Advanced Analytics')).toBeTruthy()
    expect(screen.getByText('API Access')).toBeTruthy()
  })

  it('filters features by search query', () => {
    render(<FeatureToggles {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Search features...')
    fireEvent.change(searchInput, { target: { value: 'Analytics' } })

    expect(screen.getByText('Advanced Analytics')).toBeTruthy()
    expect(screen.queryByText('API Access')).toBeFalsy()
  })

  it('shows feature category badges', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByText('advanced')).toBeTruthy()
    expect(screen.getByText('core')).toBeTruthy()
  })

  it('displays usage count for features', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByText(/Used 150 times/)).toBeTruthy()
  })

  it('shows usage limits when feature is enabled', () => {
    render(<FeatureToggles {...defaultProps} />)
    expect(screen.getByLabelText('Max Requests')).toBeTruthy()
    expect(screen.getByLabelText('Rate Limit (req/min)')).toBeTruthy()
  })

  it('calls onFeatureToggle when toggling feature', () => {
    render(<FeatureToggles {...defaultProps} />)
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[1])

    expect(mockOnFeatureToggle).toHaveBeenCalledWith('feature-2', true)
  })

  it('calls onSave when save button clicked', async () => {
    mockOnSave.mockResolvedValue(undefined)
    render(<FeatureToggles {...defaultProps} />)

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })
})
