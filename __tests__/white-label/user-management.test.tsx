import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserManagement, { TenantUser } from '@/components/white-label/user-management'

describe('UserManagement', () => {
  const mockUsers: TenantUser[] = [
    {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      role: 'member',
      status: 'invited',
      invitedAt: '2024-01-10T00:00:00Z',
      createdAt: '2024-01-10T00:00:00Z',
    },
  ]

  const mockOnInviteUser = jest.fn()
  const mockOnUpdateUserRole = jest.fn()
  const mockOnRemoveUser = jest.fn()

  const defaultProps = {
    tenantId: 'tenant-123',
    users: mockUsers,
    maxUsers: 50,
    onInviteUser: mockOnInviteUser,
    onUpdateUserRole: mockOnUpdateUserRole,
    onRemoveUser: mockOnRemoveUser,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders user management header', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('User Management')).toBeTruthy()
  })

  it('displays active users count', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('shows invite user button', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('Invite User')).toBeTruthy()
  })

  it('displays all users in table', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeTruthy()
    expect(screen.getByText('jane@example.com')).toBeTruthy()
  })

  it('shows user status badges', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('Active')).toBeTruthy()
    expect(screen.getByText('Invited')).toBeTruthy()
  })

  it('displays user role badges', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('Admin')).toBeTruthy()
    expect(screen.getByText('Member')).toBeTruthy()
  })

  it('opens invite dialog when invite button clicked', () => {
    render(<UserManagement {...defaultProps} />)
    const inviteButton = screen.getByText('Invite User')
    fireEvent.click(inviteButton)

    expect(screen.getByText('Send an invitation to join this tenant')).toBeTruthy()
  })

  it('validates email in invite dialog', () => {
    render(<UserManagement {...defaultProps} />)
    const inviteButton = screen.getByText('Invite User')
    fireEvent.click(inviteButton)

    const sendButton = screen.getByText('Send Invitation')
    expect(sendButton).toBeDisabled()
  })

  it('calls onInviteUser when inviting user', async () => {
    mockOnInviteUser.mockResolvedValue(undefined)
    render(<UserManagement {...defaultProps} />)

    const inviteButton = screen.getByText('Invite User')
    fireEvent.click(inviteButton)

    const emailInput = screen.getByPlaceholderText('user@example.com')
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })

    const sendButton = screen.getByText('Send Invitation')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(mockOnInviteUser).toHaveBeenCalledWith('newuser@example.com', 'viewer')
    })
  })

  it('shows SSO configuration section', () => {
    render(<UserManagement {...defaultProps} />)
    expect(screen.getByText('Single Sign-On (SSO)')).toBeTruthy()
  })
})
