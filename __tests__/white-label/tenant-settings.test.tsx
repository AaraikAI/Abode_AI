import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TenantSettings, { TenantConfig } from '@/components/white-label/tenant-settings'

describe('TenantSettings', () => {
  const mockTenant: TenantConfig = {
    id: 'tenant-123',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    domain: 'app.acme.com',
    subdomain: 'acme',
    status: 'active',
    plan: 'pro',
    maxUsers: 50,
    maxStorage: 1024,
    dataRegion: 'us-east-1',
    isolationLevel: 'dedicated',
    ssoEnabled: true,
    customDomainEnabled: true,
    apiAccessEnabled: true,
  }

  const mockOnSave = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSuspend = jest.fn()

  const defaultProps = {
    tenant: mockTenant,
    onSave: mockOnSave,
    onDelete: mockOnDelete,
    onSuspend: mockOnSuspend,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders tenant configuration header', () => {
    render(<TenantSettings {...defaultProps} />)
    expect(screen.getByText('Tenant Configuration')).toBeTruthy()
  })

  it('displays tenant status badge', () => {
    render(<TenantSettings {...defaultProps} />)
    expect(screen.getByText('ACTIVE')).toBeTruthy()
  })

  it('shows tenant basic information in general tab', () => {
    render(<TenantSettings {...defaultProps} />)
    expect(screen.getByDisplayValue('Acme Corporation')).toBeTruthy()
    expect(screen.getByDisplayValue('acme-corp')).toBeTruthy()
  })

  it('displays all configuration tabs', () => {
    render(<TenantSettings {...defaultProps} />)
    expect(screen.getByText('General')).toBeTruthy()
    expect(screen.getByText('Domains')).toBeTruthy()
    expect(screen.getByText('Isolation')).toBeTruthy()
    expect(screen.getByText('Limits')).toBeTruthy()
  })

  it('allows editing tenant name', () => {
    render(<TenantSettings {...defaultProps} />)
    const nameInput = screen.getByDisplayValue('Acme Corporation')
    fireEvent.change(nameInput, { target: { value: 'New Name' } })
    expect(screen.getByDisplayValue('New Name')).toBeTruthy()
  })

  it('validates tenant slug format', async () => {
    render(<TenantSettings {...defaultProps} />)
    const slugInput = screen.getByDisplayValue('acme-corp')
    fireEvent.change(slugInput, { target: { value: 'INVALID_SLUG!' } })

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Slug must contain only lowercase/i)).toBeTruthy()
    })
  })

  it('shows subdomain configuration in domains tab', () => {
    render(<TenantSettings {...defaultProps} />)
    const domainsTab = screen.getByText('Domains')
    fireEvent.click(domainsTab)

    expect(screen.getByDisplayValue('acme')).toBeTruthy()
    expect(screen.getByText('.abode-ai.com')).toBeTruthy()
  })

  it('displays custom domain when enabled', () => {
    render(<TenantSettings {...defaultProps} />)
    const domainsTab = screen.getByText('Domains')
    fireEvent.click(domainsTab)

    const customDomainInput = screen.getByDisplayValue('app.acme.com')
    expect(customDomainInput).toBeTruthy()
  })

  it('calls onSave when save button clicked', async () => {
    mockOnSave.mockResolvedValue(undefined)
    render(<TenantSettings {...defaultProps} />)

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        id: 'tenant-123',
        name: 'Acme Corporation',
      }))
    })
  })

  it('disables inputs when readOnly is true', () => {
    render(<TenantSettings {...defaultProps} readOnly={true} />)
    const nameInput = screen.getByDisplayValue('Acme Corporation')
    expect(nameInput).toBeDisabled()
  })
})
