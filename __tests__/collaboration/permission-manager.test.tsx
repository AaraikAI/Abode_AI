import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { PermissionManager, ProjectMember } from "@/components/collaboration/permission-manager"

describe("PermissionManager", () => {
  const mockMembers: ProjectMember[] = [
    {
      id: "user-1",
      email: "owner@example.com",
      name: "John Doe",
      avatar: "/avatar1.jpg",
      role: "owner",
      addedAt: new Date().toISOString(),
    },
    {
      id: "user-2",
      email: "editor@example.com",
      name: "Jane Smith",
      role: "editor",
      addedAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
    },
    {
      id: "user-3",
      email: "viewer@example.com",
      role: "viewer",
      addedAt: new Date(Date.now() - 14 * 24 * 60 * 60000).toISOString(),
    },
  ]

  const mockOnAddMember = jest.fn()
  const mockOnUpdateRole = jest.fn()
  const mockOnRemoveMember = jest.fn()

  const defaultProps = {
    members: mockMembers,
    currentUserId: "user-1",
    onAddMember: mockOnAddMember,
    onUpdateRole: mockOnUpdateRole,
    onRemoveMember: mockOnRemoveMember,
    canManagePermissions: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders permissions header", () => {
    render(<PermissionManager {...defaultProps} />)
    expect(screen.getByText("Permissions")).toBeTruthy()
  })

  it("displays member count badge", () => {
    render(<PermissionManager {...defaultProps} />)
    expect(screen.getByText("3 members")).toBeTruthy()
  })

  it("shows add member button when user can manage", () => {
    render(<PermissionManager {...defaultProps} />)
    expect(screen.getByText("Add Member")).toBeTruthy()
  })

  it("hides add member button when user cannot manage", () => {
    render(<PermissionManager {...defaultProps} canManagePermissions={false} />)
    expect(screen.queryByText("Add Member")).toBeNull()
  })

  it("displays role descriptions", () => {
    render(<PermissionManager {...defaultProps} />)
    expect(screen.getByText("Owner")).toBeTruthy()
    expect(screen.getByText("Editor")).toBeTruthy()
    expect(screen.getByText("Viewer")).toBeTruthy()
  })

  it("shows all members in table", () => {
    render(<PermissionManager {...defaultProps} />)
    expect(screen.getByText("John Doe")).toBeTruthy()
    expect(screen.getByText("Jane Smith")).toBeTruthy()
    expect(screen.getByText("viewer@example.com")).toBeTruthy()
  })

  it("marks current user with (You) label", () => {
    render(<PermissionManager {...defaultProps} />)
    expect(screen.getByText("(You)")).toBeTruthy()
  })

  it("opens add member dialog when button clicked", () => {
    render(<PermissionManager {...defaultProps} />)
    const addButton = screen.getByText("Add Member")
    fireEvent.click(addButton)
    expect(screen.getByText(/Invite someone to collaborate/i)).toBeTruthy()
  })

  it("displays email input in add member dialog", () => {
    render(<PermissionManager {...defaultProps} />)
    const addButton = screen.getByText("Add Member")
    fireEvent.click(addButton)
    expect(screen.getByPlaceholderText(/colleague@example.com/i)).toBeTruthy()
  })

  it("shows member added dates", () => {
    render(<PermissionManager {...defaultProps} />)
    // Should show formatted dates for all members
    const { container } = render(<PermissionManager {...defaultProps} />)
    expect(container.innerHTML).toContain('addedAt')
  })
})
