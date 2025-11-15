import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { IFCExport, ExportSettings } from "@/components/bim/ifc-export"

describe("IFCExport", () => {
  const mockProps = {
    modelName: "Office Building - Level 1",
    elementCount: 1247,
    onExport: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders IFC export interface with header", () => {
    render(<IFCExport {...mockProps} />)
    expect(screen.getByText("Export to IFC")).toBeTruthy()
  })

  it("displays model name and element count", () => {
    render(<IFCExport {...mockProps} />)
    expect(screen.getByText("Office Building - Level 1")).toBeTruthy()
    expect(screen.getByText(/1247 elements/i)).toBeTruthy()
  })

  it("shows estimated file size", () => {
    render(<IFCExport {...mockProps} />)
    expect(screen.getByText(/Est\. size:/i)).toBeTruthy()
    expect(screen.getByText(/MB/i)).toBeTruthy()
  })

  it("renders schema version selection options", () => {
    render(<IFCExport {...mockProps} />)

    // Open the accordion
    const schemaAccordion = screen.getByText(/Schema & Format/i)
    fireEvent.click(schemaAccordion)

    waitFor(() => {
      expect(screen.getByText(/IFC 2x3/i)).toBeTruthy()
      expect(screen.getByText(/IFC 4/i)).toBeTruthy()
      expect(screen.getByText(/IFC 4\.3/i)).toBeTruthy()
    })
  })

  it("displays file format dropdown with options", () => {
    render(<IFCExport {...mockProps} />)

    const schemaAccordion = screen.getByText(/Schema & Format/i)
    fireEvent.click(schemaAccordion)

    waitFor(() => {
      const formatSelect = screen.getByRole('combobox')
      expect(formatSelect).toBeTruthy()
    })
  })

  it("shows model view definition selector", () => {
    render(<IFCExport {...mockProps} />)

    const schemaAccordion = screen.getByText(/Schema & Format/i)
    fireEvent.click(schemaAccordion)

    waitFor(() => {
      expect(screen.getByText(/Model View Definition/i)).toBeTruthy()
    })
  })

  it("renders content options checkboxes", () => {
    render(<IFCExport {...mockProps} />)

    const contentAccordion = screen.getByText(/Content Options/i)
    fireEvent.click(contentAccordion)

    waitFor(() => {
      expect(screen.getByText(/Include Geometry/i)).toBeTruthy()
      expect(screen.getByText(/Include IFC Properties/i)).toBeTruthy()
      expect(screen.getByText(/Include Quantity Sets/i)).toBeTruthy()
      expect(screen.getByText(/Include Materials/i)).toBeTruthy()
    })
  })

  it("displays advanced options accordion", () => {
    render(<IFCExport {...mockProps} />)
    expect(screen.getByText(/Advanced Options/i)).toBeTruthy()
  })

  it("shows export button", () => {
    render(<IFCExport {...mockProps} />)
    expect(screen.getByText(/Export IFC/i)).toBeTruthy()
  })

  it("displays cancel button when onCancel is provided", () => {
    render(<IFCExport {...mockProps} />)
    expect(screen.getByText("Cancel")).toBeTruthy()
  })

  it("shows progress bar during export", async () => {
    render(<IFCExport {...mockProps} />)

    const exportButton = screen.getByText(/Export IFC/i)
    fireEvent.click(exportButton)

    await waitFor(() => {
      const progressBars = document.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })
})
