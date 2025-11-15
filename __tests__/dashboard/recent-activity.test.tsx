import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RecentActivity, ActivityEvent } from "@/components/dashboard/recent-activity"

global.fetch = jest.fn()

describe("RecentActivity", () => {
  const mockEvents: ActivityEvent[] = [
    {
      id: "event-1",
      type: "project_created",
      userId: "user-1",
      userName: "John Doe",
      userAvatar: "/avatar1.jpg",
      targetId: "project-1",
      targetName: "Modern Villa",
      timestamp: new Date().toISOString(),
    },
    {
      id: "event-2",
      type: "file_uploaded",
      userId: "user-2",
      userName: "Jane Smith",
      targetId: "file-1",
      targetName: "floor-plan.dwg",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "event-3",
      type: "comment_added",
      userId: "user-3",
      userName: "Bob Johnson",
      targetId: "project-2",
      targetName: "Office Complex",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      description: "Bob Johnson commented on the design",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ events: mockEvents }),
    })
  })

  it("renders activity feed with events", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeTruthy()
      expect(screen.getByText("Jane Smith")).toBeTruthy()
      expect(screen.getByText("Bob Johnson")).toBeTruthy()
    })
  })

  it("displays activity descriptions correctly", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      expect(screen.getByText(/created project/i)).toBeTruthy()
      expect(screen.getByText(/uploaded a file/i)).toBeTruthy()
    })
  })

  it("shows user avatars for each activity", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      const avatars = screen.getAllByRole("img", { hidden: true })
      expect(avatars.length).toBeGreaterThan(0)
    })
  })

  it("displays appropriate icons for different activity types", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      const icons = document.querySelectorAll("svg")
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  it("formats timestamps as relative time", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      expect(screen.getByText(/just now|ago/i)).toBeTruthy()
    })
  })

  it("shows empty state when no activity events", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    })

    render(<RecentActivity />)
    await waitFor(() => {
      expect(screen.getByText(/No recent activity/i)).toBeTruthy()
    })
  })

  it("provides refresh button to reload activity", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeTruthy()
    })
  })

  it("calls API with correct parameters", async () => {
    render(<RecentActivity orgId="org-123" userId="user-1" limit={25} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("orgId=org-123"),
        undefined
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("userId=user-1"),
        undefined
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=25"),
        undefined
      )
    })
  })

  it("displays link to view project for project-related activities", async () => {
    render(<RecentActivity />)
    await waitFor(() => {
      const links = screen.getAllByText(/View project/i)
      expect(links.length).toBeGreaterThan(0)
    })
  })

  it("auto-refreshes activity when autoRefresh is enabled", async () => {
    jest.useFakeTimers()
    render(<RecentActivity autoRefresh={true} refreshInterval={5000} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    jest.useRealTimers()
  })
})
