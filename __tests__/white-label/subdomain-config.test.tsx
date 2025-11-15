import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SubdomainConfig, { DomainConfig, DNSRecord } from '@/components/white-label/subdomain-config'

describe('SubdomainConfig', () => {
  const mockDNSRecords: DNSRecord[] = [
    {
      type: 'CNAME',
      name: 'app.example.com',
      value: 'abode-ai.com',
      ttl: 3600,
      verified: true,
    },
  ]

  const mockDomainConfig: DomainConfig = {
    subdomain: 'acme',
    customDomain: 'app.acme.com',
    status: 'active',
    verificationMethod: 'dns',
    dnsRecords: mockDNSRecords,
    sslStatus: 'active',
    sslExpiresAt: '2025-01-01T00:00:00Z',
    autoRenewSSL: true,
  }

  const mockOnSave = jest.fn()
  const mockOnVerifyDomain = jest.fn()
  const mockOnProvisionSSL = jest.fn()

  const defaultProps = {
    tenantId: 'tenant-123',
    tenantSlug: 'acme',
    domainConfig: mockDomainConfig,
    baseDomain: 'abode-ai.com',
    onSave: mockOnSave,
    onVerifyDomain: mockOnVerifyDomain,
    onProvisionSSL: mockOnProvisionSSL,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders domain configuration header', () => {
    render(<SubdomainConfig {...defaultProps} />)
    expect(screen.getByText('Domain Configuration')).toBeTruthy()
  })

  it('displays domain status badge', () => {
    render(<SubdomainConfig {...defaultProps} />)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('shows ssl status badge', () => {
    render(<SubdomainConfig {...defaultProps} />)
    expect(screen.getAllByText('Active')[0]).toBeTruthy()
  })

  it('displays all configuration tabs', () => {
    render(<SubdomainConfig {...defaultProps} />)
    expect(screen.getByText('Subdomain')).toBeTruthy()
    expect(screen.getByText('Custom Domain')).toBeTruthy()
    expect(screen.getByText('SSL Certificate')).toBeTruthy()
  })

  it('shows subdomain input with base domain', () => {
    render(<SubdomainConfig {...defaultProps} />)
    expect(screen.getByDisplayValue('acme')).toBeTruthy()
    expect(screen.getByText('.abode-ai.com')).toBeTruthy()
  })

  it('displays custom domain input', () => {
    render(<SubdomainConfig {...defaultProps} />)
    const customTab = screen.getByText('Custom Domain')
    fireEvent.click(customTab)

    expect(screen.getByDisplayValue('app.acme.com')).toBeTruthy()
  })

  it('shows dns records when available', () => {
    render(<SubdomainConfig {...defaultProps} />)
    const customTab = screen.getByText('Custom Domain')
    fireEvent.click(customTab)

    expect(screen.getByText('CNAME Record')).toBeTruthy()
    expect(screen.getByText('Verified')).toBeTruthy()
  })

  it('displays ssl certificate information', () => {
    render(<SubdomainConfig {...defaultProps} />)
    const sslTab = screen.getByText('SSL Certificate')
    fireEvent.click(sslTab)

    expect(screen.getByText('SSL Status')).toBeTruthy()
  })

  it('shows auto-renew ssl toggle', () => {
    render(<SubdomainConfig {...defaultProps} />)
    const sslTab = screen.getByText('SSL Certificate')
    fireEvent.click(sslTab)

    expect(screen.getByText('Auto-Renew SSL')).toBeTruthy()
  })

  it('calls onSave when save button clicked', async () => {
    mockOnSave.mockResolvedValue(undefined)
    render(<SubdomainConfig {...defaultProps} />)

    const saveButton = screen.getByText('Save Configuration')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })

  it('disables inputs when readOnly is true', () => {
    render(<SubdomainConfig {...defaultProps} readOnly={true} />)
    const subdomainInput = screen.getByDisplayValue('acme')
    expect(subdomainInput).toBeDisabled()
  })
})
