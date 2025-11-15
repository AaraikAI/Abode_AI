import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import UsageAnalytics, { UsageMetric, ActivityEvent, UsageStats } from '@/components/white-label/usage-analytics'

describe('UsageAnalytics', () => {
  const mockMetrics: UsageMetric[] = [
    {
      date: '2024-01-01',
      activeUsers: 25,
      apiRequests: 1000,
      storageUsed: 500,
      features: {
        'Advanced Analytics': 50,
        'API Access': 100,
      },
    },
    {
      date: '2024-01-02',
      activeUsers: 30,
      apiRequests: 1200,
      storageUsed: 520,
      features: {
        'Advanced Analytics': 60,
        'API Access': 120,
      },
    },
  ]

  const mockActivities: ActivityEvent[] = [
    {
      id: 'activity-1',
      userId: 'user-1',
      userName: 'John Doe',
      action: 'created',
      resource: 'project',
      timestamp: '2024-01-15T10:00:00Z',
    },
  ]

  const mockStats: UsageStats = {
    totalUsers: 50,
    activeUsers: 30,
    totalRequests: 10000,
    avgResponseTime: 150,
    storageUsed: 50 * 1024,
    storageLimit: 100 * 1024,
    bandwidthUsed: 5 * 1024 * 1024 * 1024,
  }

  const mockOnExport = jest.fn()
  const mockOnRefresh = jest.fn()

  const defaultProps = {
    tenantId: 'tenant-123',
    metrics: mockMetrics,
    activities: mockActivities,
    stats: mockStats,
    onExport: mockOnExport,
    onRefresh: mockOnRefresh,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders usage analytics header', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Usage Analytics')).toBeTruthy()
  })

  it('displays total users stat', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Total Users')).toBeTruthy()
    expect(screen.getByText('50')).toBeTruthy()
  })

  it('shows api requests count', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('API Requests')).toBeTruthy()
    expect(screen.getByText(/2,200/)).toBeTruthy()
  })

  it('displays storage usage', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Storage Used')).toBeTruthy()
    expect(screen.getByText(/50.0 GB/)).toBeTruthy()
  })

  it('shows bandwidth usage', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Bandwidth')).toBeTruthy()
  })

  it('displays time period selector', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Last 30 days')).toBeTruthy()
  })

  it('shows usage trend section', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Usage Trend')).toBeTruthy()
  })

  it('displays top features section', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Top Features')).toBeTruthy()
  })

  it('shows recent activity feed', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Recent Activity')).toBeTruthy()
    expect(screen.getByText('John Doe')).toBeTruthy()
  })

  it('displays export section', () => {
    render(<UsageAnalytics {...defaultProps} />)
    expect(screen.getByText('Export Data')).toBeTruthy()
  })

  it('calls onRefresh when refresh button clicked', () => {
    render(<UsageAnalytics {...defaultProps} />)
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockOnRefresh).toHaveBeenCalled()
  })
})
