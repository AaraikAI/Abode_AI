import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { IFCImporter, IFCFile, ValidationResult } from "@/components/bim/ifc-importer"

describe("IFCImporter", () => {
  const mockOnImport = jest.fn()
  const mockOnCancel = jest.fn()

  const defaultProps = {
    onImport: mockOnImport,
    onCancel: mockOnCancel,
    maxFileSize: 100 * 1024 * 1024,
    acceptedFormats: ['.ifc', '.ifczip', '.ifcxml'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders file import interface with drag and drop zone", () => {
    render(<IFCImporter {...defaultProps} />)
    expect(screen.getByText(/Drop IFC file here or click to browse/i)).toBeTruthy()
    expect(screen.getByText(/Supported formats/i)).toBeTruthy()
  })

  it("displays accepted file formats", () => {
    render(<IFCImporter {...defaultProps} />)
    expect(screen.getByText(/\.ifc, \.ifczip, \.ifcxml/i)).toBeTruthy()
  })

  it("shows maximum file size", () => {
    render(<IFCImporter {...defaultProps} />)
    expect(screen.getByText(/100\.00 MB/i)).toBeTruthy()
  })

  it("renders select file button", () => {
    render(<IFCImporter {...defaultProps} />)
    const selectButton = screen.getByText("Select File")
    expect(selectButton).toBeTruthy()
  })

  it("displays file information after selection", async () => {
    render(<IFCImporter {...defaultProps} />)

    const file = new File(['test content'], 'test.ifc', { type: 'application/ifc' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('test.ifc')).toBeTruthy()
      })
    }
  })

  it("shows progress bar during upload and validation", async () => {
    render(<IFCImporter {...defaultProps} />)

    const file = new File(['test content'], 'model.ifc', { type: 'application/ifc' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        const progressBars = document.querySelectorAll('[role="progressbar"]')
        expect(progressBars.length).toBeGreaterThan(0)
      })
    }
  })

  it("displays validation results with schema and element count", async () => {
    render(<IFCImporter {...defaultProps} />)

    const file = new File(['test content'], 'building.ifc', { type: 'application/ifc' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/IFC2x3/i)).toBeTruthy()
        expect(screen.getByText(/elements/i)).toBeTruthy()
      }, { timeout: 5000 })
    }
  })

  it("shows validation warnings in separate tab", async () => {
    render(<IFCImporter {...defaultProps} />)

    const file = new File(['test content'], 'model.ifc', { type: 'application/ifc' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        const warningsTab = screen.getByText(/Warnings/i)
        expect(warningsTab).toBeTruthy()
      }, { timeout: 5000 })
    }
  })

  it("provides clear button to reset the import", async () => {
    render(<IFCImporter {...defaultProps} />)

    const file = new File(['test content'], 'test.ifc', { type: 'application/ifc' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        const clearButton = screen.getByText(/Clear/i)
        expect(clearButton).toBeTruthy()
        fireEvent.click(clearButton)
      })

      expect(screen.getByText(/Drop IFC file here/i)).toBeTruthy()
    }
  })

  it("shows preview button for imported model", async () => {
    render(<IFCImporter {...defaultProps} />)

    const file = new File(['test content'], 'model.ifc', { type: 'application/ifc' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        const previewButton = screen.getByText(/Preview Model/i)
        expect(previewButton).toBeTruthy()
      }, { timeout: 5000 })
    }
  })
})
