import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { ActivityFeed, ActivityItem } from "@/components/collaboration/activity-feed"

describe("ActivityFeed", () => {
  const mockActivities: ActivityItem[] = [
    {
      id: "1",
      type: "edit",
      userId: "user-1",
      userName: "John Doe",
      userAvatar: "/avatar1.jpg",
      timestamp: new Date().toISOString(),
      description: "Updated the project layout",
      metadata: {
        changeCount: 5,
      },
    },
    {
      id: "2",
      type: "comment",
      userId: "user-2",
      userName: "Jane Smith",
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      description: "Added a comment",
      metadata: {
        commentText: "Looks great!",
      },
    },
    {
      id: "3",
      type: "member_added",
      userId: "user-1",
      userName: "John Doe",
      timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      description: "Added a new member",
      metadata: {
        memberEmail: "newmember@example.com",
      },
    },
    {
      id: "4",
      type: "version_created",
      userId: "user-3",
      userName: "Bob Wilson",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
      description: "Created a new version",
      metadata: {
        versionNumber: 2,
      },
    },
  ]

  const mockOnRefresh = jest.fn()

  const defaultProps = {
    activities: mockActivities,
    onRefresh: mockOnRefresh,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders activity feed header", () => {
    render(<ActivityFeed {...defaultProps} />)
    expect(screen.getByText("Activity Feed")).toBeTruthy()
  })

  it("displays all activities", () => {
    render(<ActivityFeed {...defaultProps} />)
    expect(screen.getByText("Updated the project layout")).toBeTruthy()
    expect(screen.getByText("Added a comment")).toBeTruthy()
    expect(screen.getByText("Added a new member")).toBeTruthy()
  })

  it("shows filter button when showFilters is true", () => {
    render(<ActivityFeed {...defaultProps} showFilters={true} />)
    expect(screen.getByText("Filter")).toBeTruthy()
  })

  it("hides filter button when showFilters is false", () => {
    render(<ActivityFeed {...defaultProps} showFilters={false} />)
    expect(screen.queryByText("Filter")).toBeNull()
  })

  it("displays refresh button when onRefresh is provided", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />)
    const refreshButton = container.querySelector('.lucide-refresh-cw')
    expect(refreshButton).toBeTruthy()
  })

  it("calls onRefresh when refresh button clicked", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />)
    const refreshButtons = container.querySelectorAll('button')
    const refreshButton = Array.from(refreshButtons).find(btn =>
      btn.querySelector('.lucide-refresh-cw')
    )

    if (refreshButton) {
      fireEvent.click(refreshButton)
      expect(mockOnRefresh).toHaveBeenCalled()
    }
  })

  it("shows user avatars and names", () => {
    render(<ActivityFeed {...defaultProps} />)
    expect(screen.getByText("John Doe")).toBeTruthy()
    expect(screen.getByText("Jane Smith")).toBeTruthy()
  })

  it("displays relative timestamps", () => {
    render(<ActivityFeed {...defaultProps} />)
    expect(screen.getByText(/ago/i)).toBeTruthy()
  })

  it("shows activity metadata when available", () => {
    render(<ActivityFeed {...defaultProps} />)
    expect(screen.getByText(/5 changes/i)).toBeTruthy()
    expect(screen.getByText(/Looks great!/i)).toBeTruthy()
  })

  it("displays empty state when no activities", () => {
    render(<ActivityFeed {...defaultProps} activities={[]} />)
    expect(screen.getByText("No activities to show")).toBeTruthy()
  })
})
