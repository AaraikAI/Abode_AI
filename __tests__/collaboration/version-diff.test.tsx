import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { VersionDiff, VersionDiffData, FileDiff, DiffLine } from "@/components/collaboration/version-diff"

describe("VersionDiff", () => {
  const mockDiffData: VersionDiffData = {
    oldVersion: {
      id: "v1",
      name: "Version 1",
      versionNumber: 1,
    },
    newVersion: {
      id: "v2",
      name: "Version 2",
      versionNumber: 2,
    },
    files: [
      {
        path: "src/index.ts",
        changeType: "modified",
        oldLines: [
          { lineNumber: 1, content: "const x = 1", type: "unchanged" },
          { lineNumber: 2, content: "const y = 2", type: "removed" },
        ],
        newLines: [
          { lineNumber: 1, content: "const x = 1", type: "unchanged" },
          { lineNumber: 2, content: "const y = 3", type: "added" },
        ],
      },
      {
        path: "src/utils.ts",
        changeType: "added",
        newLines: [
          { lineNumber: 1, content: "export function helper() {}", type: "added" },
        ],
      },
    ],
    summary: {
      filesChanged: 2,
      additions: 2,
      deletions: 1,
    },
  }

  const mockOnClose = jest.fn()

  const defaultProps = {
    diffData: mockDiffData,
    onClose: mockOnClose,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders version comparison header", () => {
    render(<VersionDiff {...defaultProps} />)
    expect(screen.getByText("Version Comparison")).toBeTruthy()
  })

  it("displays version numbers being compared", () => {
    render(<VersionDiff {...defaultProps} />)
    expect(screen.getByText(/Comparing v1 with v2/i)).toBeTruthy()
  })

  it("shows summary of changes", () => {
    render(<VersionDiff {...defaultProps} />)
    expect(screen.getByText("2 files changed")).toBeTruthy()
    expect(screen.getByText("+2 additions")).toBeTruthy()
    expect(screen.getByText("-1 deletions")).toBeTruthy()
  })

  it("displays split and unified view tabs", () => {
    render(<VersionDiff {...defaultProps} />)
    expect(screen.getByText("Split View")).toBeTruthy()
    expect(screen.getByText("Unified View")).toBeTruthy()
  })

  it("shows file navigation with current position", () => {
    render(<VersionDiff {...defaultProps} />)
    expect(screen.getByText("1 / 2")).toBeTruthy()
  })

  it("lists all changed files", () => {
    render(<VersionDiff {...defaultProps} />)
    expect(screen.getByText("src/index.ts")).toBeTruthy()
    expect(screen.getByText("src/utils.ts")).toBeTruthy()
  })

  it("highlights selected file", () => {
    const { container } = render(<VersionDiff {...defaultProps} />)
    const fileButtons = container.querySelectorAll('button[class*="w-full"]')
    expect(fileButtons[0]?.className).toContain('bg-muted')
  })

  it("navigates to next file when next button clicked", () => {
    const { container } = render(<VersionDiff {...defaultProps} />)
    const nextButton = screen.getByRole('button', { name: '' })
    const buttons = container.querySelectorAll('button')
    const nextBtn = Array.from(buttons).find(btn => btn.querySelector('.lucide-chevron-right'))

    if (nextBtn) {
      fireEvent.click(nextBtn)
      expect(screen.getByText("2 / 2")).toBeTruthy()
    }
  })

  it("disables previous button on first file", () => {
    const { container } = render(<VersionDiff {...defaultProps} />)
    const buttons = container.querySelectorAll('button')
    const prevBtn = Array.from(buttons).find(btn => btn.querySelector('.lucide-chevron-left'))
    expect(prevBtn?.disabled).toBe(true)
  })

  it("calls onClose when close button clicked", () => {
    render(<VersionDiff {...defaultProps} />)
    const closeButton = screen.getByText("Close")
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })
})
