import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import APIKeyManager, { APIKey, Webhook } from '@/components/white-label/api-key-manager'

describe('APIKeyManager', () => {
  const mockApiKeys: APIKey[] = [
    {
      id: 'key-1',
      name: 'Production API Key',
      key: 'sk_prod_1234567890abcdefghijklmnopqrstuvwxyz',
      prefix: 'sk_prod',
      createdAt: '2024-01-01T00:00:00Z',
      lastUsed: '2024-01-15T10:00:00Z',
      rateLimit: 1000,
      requestCount: 5000,
      status: 'active',
    },
  ]

  const mockWebhooks: Webhook[] = [
    {
      id: 'webhook-1',
      url: 'https://api.example.com/webhooks',
      events: ['user.created', 'payment.succeeded'],
      secret: 'whsec_123',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      deliveryCount: 150,
    },
  ]

  const mockOnGenerateKey = jest.fn()
  const mockOnRevokeKey = jest.fn()
  const mockOnCreateWebhook = jest.fn()
  const mockOnDeleteWebhook = jest.fn()

  const defaultProps = {
    tenantId: 'tenant-123',
    apiKeys: mockApiKeys,
    webhooks: mockWebhooks,
    onGenerateKey: mockOnGenerateKey,
    onRevokeKey: mockOnRevokeKey,
    onCreateWebhook: mockOnCreateWebhook,
    onDeleteWebhook: mockOnDeleteWebhook,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders api key manager header', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('API Key Manager')).toBeTruthy()
  })

  it('displays active keys count', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('Active Keys')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('shows total requests count', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('Total Requests')).toBeTruthy()
    expect(screen.getByText('5,000')).toBeTruthy()
  })

  it('displays api keys table', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('Production API Key')).toBeTruthy()
  })

  it('masks api key by default', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText(/sk_prod•••/)).toBeTruthy()
  })

  it('shows generate key button', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('Generate Key')).toBeTruthy()
  })

  it('opens generate key dialog when button clicked', () => {
    render(<APIKeyManager {...defaultProps} />)
    const generateButton = screen.getByText('Generate Key')
    fireEvent.click(generateButton)

    expect(screen.getByText('Generate New API Key')).toBeTruthy()
  })

  it('displays webhooks section', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('Webhooks')).toBeTruthy()
  })

  it('shows webhook url and events', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText('https://api.example.com/webhooks')).toBeTruthy()
    expect(screen.getByText('user.created')).toBeTruthy()
    expect(screen.getByText('payment.succeeded')).toBeTruthy()
  })

  it('displays webhook delivery count', () => {
    render(<APIKeyManager {...defaultProps} />)
    expect(screen.getByText(/150 deliveries/)).toBeTruthy()
  })
})
