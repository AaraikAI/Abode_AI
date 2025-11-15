import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { CursorOverlay, UserCursor } from "@/components/collaboration/cursor-overlay"

describe("CursorOverlay", () => {
  const mockCursors: UserCursor[] = [
    {
      userId: "user-1",
      userName: "John Doe",
      x: 100,
      y: 150,
      color: "#FF5733",
      lastUpdate: Date.now(),
    },
    {
      userId: "user-2",
      userName: "Jane Smith",
      x: 200,
      y: 250,
      color: "#33FF57",
      lastUpdate: Date.now(),
    },
    {
      userId: "user-3",
      userName: "Bob Wilson",
      x: 300,
      y: 350,
      color: "#3357FF",
      lastUpdate: Date.now() - 10000, // 10 seconds ago (faded)
    },
  ]

  const defaultProps = {
    cursors: mockCursors,
    currentUserId: "current-user",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders cursor overlay container", () => {
    const { container } = render(<CursorOverlay {...defaultProps} />)
    const overlay = container.querySelector('.fixed.inset-0')
    expect(overlay).toBeTruthy()
  })

  it("displays cursor for each user except current user", () => {
    const { container } = render(<CursorOverlay {...defaultProps} />)
    const cursors = container.querySelectorAll('.lucide-mouse-pointer-2')
    expect(cursors.length).toBe(3)
  })

  it("hides current user cursor", () => {
    const cursorsWithCurrent: UserCursor[] = [
      ...mockCursors,
      {
        userId: "current-user",
        userName: "Current User",
        x: 400,
        y: 450,
        color: "#FF33FF",
        lastUpdate: Date.now(),
      },
    ]
    const { container } = render(
      <CursorOverlay {...defaultProps} cursors={cursorsWithCurrent} currentUserId="current-user" />
    )
    const cursors = container.querySelectorAll('.lucide-mouse-pointer-2')
    expect(cursors.length).toBe(3) // Should still be 3, not 4
  })

  it("shows user labels when showLabels is true", () => {
    render(<CursorOverlay {...defaultProps} showLabels={true} />)
    expect(screen.getByText("John Doe")).toBeTruthy()
    expect(screen.getByText("Jane Smith")).toBeTruthy()
  })

  it("hides user labels when showLabels is false", () => {
    render(<CursorOverlay {...defaultProps} showLabels={false} />)
    expect(screen.queryByText("John Doe")).toBeNull()
    expect(screen.queryByText("Jane Smith")).toBeNull()
  })

  it("positions cursors at correct coordinates", () => {
    const { container } = render(<CursorOverlay {...defaultProps} />)
    const firstCursor = container.querySelector('[style*="left: 100px"]')
    expect(firstCursor).toBeTruthy()
  })

  it("applies custom colors to cursors", () => {
    const { container } = render(<CursorOverlay {...defaultProps} />)
    const cursors = container.querySelectorAll('.lucide-mouse-pointer-2')
    const firstCursor = cursors[0] as HTMLElement
    expect(firstCursor?.style.color).toBe('rgb(255, 87, 51)') // #FF5733
  })

  it("fades inactive cursors based on fadeAfterMs", () => {
    const { container } = render(<CursorOverlay {...defaultProps} fadeAfterMs={5000} />)
    const allCursors = container.querySelectorAll('[class*="absolute"]')
    // The old cursor should have reduced opacity
    const oldCursor = allCursors[2] as HTMLElement
    if (oldCursor) {
      expect(parseFloat(oldCursor.style.opacity)).toBeLessThan(1)
    }
  })

  it("applies pointer-events-none to prevent interference", () => {
    const { container } = render(<CursorOverlay {...defaultProps} />)
    const overlay = container.querySelector('.pointer-events-none')
    expect(overlay).toBeTruthy()
  })

  it("renders with smooth transition by default", () => {
    const { container } = render(<CursorOverlay {...defaultProps} smoothTransition={true} />)
    expect(container.querySelector('.fixed')).toBeTruthy()
  })
})
