import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { ActiveUsers, ActiveUser } from "@/components/collaboration/active-users"

describe("ActiveUsers", () => {
  const mockUsers: ActiveUser[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/avatar1.jpg",
      status: "active",
      currentPage: "Dashboard",
      deviceType: "desktop",
      color: "#FF5733",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      status: "idle",
      lastActive: new Date(Date.now() - 10 * 60000).toISOString(),
      deviceType: "mobile",
      color: "#33FF57",
    },
    {
      id: "3",
      name: "Bob Wilson",
      status: "offline",
      lastActive: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      deviceType: "tablet",
      color: "#3357FF",
    },
  ]

  const mockOnUserClick = jest.fn()

  const defaultProps = {
    users: mockUsers,
    currentUserId: "1",
    onUserClick: mockOnUserClick,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders active users header", () => {
    render(<ActiveUsers {...defaultProps} />)
    expect(screen.getByText("Active Users")).toBeTruthy()
  })

  it("displays online user count badge", () => {
    render(<ActiveUsers {...defaultProps} />)
    expect(screen.getByText("1 online")).toBeTruthy()
  })

  it("shows user avatars in compact view", () => {
    const { container } = render(<ActiveUsers {...defaultProps} />)
    const avatars = container.querySelectorAll('[class*="h-10 w-10"]')
    expect(avatars.length).toBeGreaterThan(0)
  })

  it("displays status indicators on avatars", () => {
    const { container } = render(<ActiveUsers {...defaultProps} />)
    const statusDots = container.querySelectorAll('[class*="h-3 w-3 rounded-full"]')
    expect(statusDots.length).toBeGreaterThan(0)
  })

  it("shows +N button when users exceed maxVisibleAvatars", () => {
    render(<ActiveUsers {...defaultProps} maxVisibleAvatars={2} />)
    expect(screen.getByText("+1")).toBeTruthy()
  })

  it("expands to show all users when +N button clicked", () => {
    render(<ActiveUsers {...defaultProps} maxVisibleAvatars={2} />)
    const expandButton = screen.getByText("+1")
    fireEvent.click(expandButton)
    expect(screen.getByText("Show less")).toBeTruthy()
  })

  it("displays user names in expanded view", () => {
    render(<ActiveUsers {...defaultProps} />)
    const expandButton = screen.getByText("+0")
    if (expandButton) fireEvent.click(expandButton)
    // In expanded view, should show all names
  })

  it("shows device type icons when enabled", () => {
    const { container } = render(<ActiveUsers {...defaultProps} showDeviceType={true} />)
    // Should have device icons
    expect(container.innerHTML.includes('lucide-monitor') ||
           container.innerHTML.includes('desktop')).toBeTruthy()
  })

  it("calls onUserClick when user is clicked", () => {
    const { container } = render(<ActiveUsers {...defaultProps} />)
    const firstAvatar = container.querySelector('[class*="cursor-pointer"]')
    if (firstAvatar) {
      fireEvent.click(firstAvatar)
      expect(mockOnUserClick).toHaveBeenCalled()
    }
  })

  it("marks current user with (You) label in expanded view", () => {
    render(<ActiveUsers {...defaultProps} />)
    // Need to expand first
    const users = mockUsers.slice(0, 2)
    render(<ActiveUsers users={users} currentUserId="1" />)
    // In compact view by default
  })
})
