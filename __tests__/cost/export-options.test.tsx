import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { ExportOptions } from "@/components/cost/export-options"

describe("ExportOptions", () => {
  const mockOnExport = jest.fn()

  const defaultProps = {
    projectId: "test-project",
    projectName: "Test Project",
    onExport: mockOnExport,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders export options header", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Export Options")).toBeTruthy()
  })

  it("displays quick export section", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Quick Export")).toBeTruthy()
  })

  it("shows PDF export button", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("PDF Document")).toBeTruthy()
  })

  it("displays Excel export button", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Excel Workbook")).toBeTruthy()
  })

  it("shows CSV export button", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("CSV File")).toBeTruthy()
  })

  it("displays format tab", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Format")).toBeTruthy()
  })

  it("shows sections tab", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Sections")).toBeTruthy()
  })

  it("displays branding tab", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Branding")).toBeTruthy()
  })

  it("shows delivery tab", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Delivery")).toBeTruthy()
  })

  it("displays recent exports section", () => {
    render(<ExportOptions {...defaultProps} />)
    expect(screen.getByText("Recent Exports")).toBeTruthy()
  })
})
