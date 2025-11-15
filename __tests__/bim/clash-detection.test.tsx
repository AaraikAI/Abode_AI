import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ClashDetection, ClashResult } from "@/components/bim/clash-detection"

describe("ClashDetection", () => {
  const mockClashes: ClashResult[] = [
    {
      id: "clash-1",
      severity: "critical",
      elementA: {
        id: "elem-1",
        name: "Beam-001",
        type: "IfcBeam",
      },
      elementB: {
        id: "elem-2",
        name: "Duct-001",
        type: "IfcDuctSegment",
      },
      description: "Beam intersects with HVAC duct",
      location: { x: 10.5, y: 20.3, z: 5.2 },
      volume: 0.15,
      status: "new",
      suggestions: [
        "Relocate duct 500mm to the left",
        "Lower beam by 200mm",
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "clash-2",
      severity: "major",
      elementA: {
        id: "elem-3",
        name: "Pipe-001",
        type: "IfcPipeSegment",
      },
      elementB: {
        id: "elem-4",
        name: "Wall-001",
        type: "IfcWall",
      },
      description: "Pipe penetrates structural wall without opening",
      location: { x: 5.0, y: 15.0, z: 2.5 },
      volume: 0.08,
      status: "active",
      suggestions: ["Add wall opening for pipe passage"],
      createdAt: new Date().toISOString(),
    },
  ]

  const mockProps = {
    clashes: mockClashes,
    onRun: jest.fn(),
    onResolve: jest.fn(),
    onIgnore: jest.fn(),
    onFocus: jest.fn(),
    onExport: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders clash detection interface with header", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getByText("Clash Detection")).toBeTruthy()
  })

  it("displays run detection button", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getByText(/Run Detection/i)).toBeTruthy()
  })

  it("shows export dropdown with format options", () => {
    render(<ClashDetection {...mockProps} />)
    const exportButton = screen.getByText(/Export/i)
    expect(exportButton).toBeTruthy()
  })

  it("displays statistics cards with clash counts", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getByText("Total Clashes")).toBeTruthy()
    expect(screen.getByText("Critical")).toBeTruthy()
    expect(screen.getByText("Major")).toBeTruthy()
    expect(screen.getByText("Minor")).toBeTruthy()
    expect(screen.getByText("Resolved")).toBeTruthy()
  })

  it("renders search input for filtering clashes", () => {
    render(<ClashDetection {...mockProps} />)
    const searchInput = screen.getByPlaceholderText(/Search clashes/i)
    expect(searchInput).toBeTruthy()
  })

  it("shows severity and status filter dropdowns", () => {
    render(<ClashDetection {...mockProps} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it("displays clash items with severity icons and badges", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getByText("Beam intersects with HVAC duct")).toBeTruthy()
    expect(screen.getByText(/critical/i)).toBeTruthy()
    expect(screen.getByText(/major/i)).toBeTruthy()
  })

  it("shows element names and types for both clash participants", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getByText("Beam-001")).toBeTruthy()
    expect(screen.getByText("Duct-001")).toBeTruthy()
    expect(screen.getByText("IfcBeam")).toBeTruthy()
  })

  it("displays clash location coordinates", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getByText(/Location:/i)).toBeTruthy()
  })

  it("shows resolution suggestions when expanded", () => {
    render(<ClashDetection {...mockProps} />)
    const suggestionButton = screen.getByText(/Show.*Resolution Suggestions/i)

    fireEvent.click(suggestionButton)

    waitFor(() => {
      expect(screen.getByText(/Relocate duct 500mm to the left/i)).toBeTruthy()
    })
  })

  it("provides focus, resolve, and ignore action buttons", () => {
    render(<ClashDetection {...mockProps} />)
    expect(screen.getAllByText(/Focus/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Resolve/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Ignore/i).length).toBeGreaterThan(0)
  })
})
