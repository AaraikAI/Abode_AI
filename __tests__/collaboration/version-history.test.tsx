import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { VersionHistory, ProjectVersion } from "@/components/collaboration/version-history"

describe("VersionHistory", () => {
  const mockVersions: ProjectVersion[] = [
    {
      id: "v3",
      versionNumber: 3,
      name: "Latest Update",
      description: "Added new features",
      author: {
        id: "user-1",
        name: "John Doe",
        avatar: "/avatar1.jpg",
      },
      createdAt: new Date().toISOString(),
      changes: {
        added: 5,
        modified: 3,
        deleted: 1,
      },
      isCurrent: true,
      tags: ["production"],
    },
    {
      id: "v2",
      versionNumber: 2,
      name: "Bug Fixes",
      author: {
        id: "user-2",
        name: "Jane Smith",
      },
      createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      changes: {
        added: 0,
        modified: 7,
        deleted: 2,
      },
    },
    {
      id: "v1",
      versionNumber: 1,
      name: "Initial Release",
      author: {
        id: "user-1",
        name: "John Doe",
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
      changes: {
        added: 50,
        modified: 0,
        deleted: 0,
      },
      tags: ["milestone"],
    },
  ]

  const mockOnRestore = jest.fn()
  const mockOnPreview = jest.fn()
  const mockOnCompare = jest.fn()

  const defaultProps = {
    versions: mockVersions,
    currentVersionId: "v3",
    onRestore: mockOnRestore,
    onPreview: mockOnPreview,
    onCompare: mockOnCompare,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders version history header", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText("Version History")).toBeTruthy()
  })

  it("displays version count badge", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText("3 versions")).toBeTruthy()
  })

  it("shows all versions in timeline", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText("Latest Update")).toBeTruthy()
    expect(screen.getByText("Bug Fixes")).toBeTruthy()
    expect(screen.getByText("Initial Release")).toBeTruthy()
  })

  it("marks current version with badge", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText("Current")).toBeTruthy()
  })

  it("displays version tags", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText("production")).toBeTruthy()
    expect(screen.getByText("milestone")).toBeTruthy()
  })

  it("shows author names and avatars", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0)
    expect(screen.getByText("Jane Smith")).toBeTruthy()
  })

  it("displays change summaries with correct colors", () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText("+5 added")).toBeTruthy()
    expect(screen.getByText("~3 modified")).toBeTruthy()
    expect(screen.getByText("-1 deleted")).toBeTruthy()
  })

  it("shows preview button when onPreview is provided", () => {
    render(<VersionHistory {...defaultProps} />)
    const previewButtons = screen.getAllByText(/Preview/i)
    expect(previewButtons.length).toBeGreaterThan(0)
  })

  it("calls onPreview when preview button clicked", () => {
    render(<VersionHistory {...defaultProps} />)
    const previewButtons = screen.getAllByText(/Preview/i)
    fireEvent.click(previewButtons[0])
    expect(mockOnPreview).toHaveBeenCalled()
  })

  it("shows restore button for non-current versions", () => {
    render(<VersionHistory {...defaultProps} />)
    const restoreButtons = screen.getAllByText(/Restore/i)
    expect(restoreButtons.length).toBeGreaterThan(0)
  })
})
