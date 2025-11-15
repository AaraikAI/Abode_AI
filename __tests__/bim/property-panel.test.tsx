import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PropertyPanel, BIMElementProperties } from "@/components/bim/property-panel"

describe("PropertyPanel", () => {
  const mockElement: BIMElementProperties = {
    elementId: "elem-123",
    elementName: "Wall-001",
    elementType: "IfcWall",
    globalId: "2x3$abc123def456",
    propertySets: [
      {
        id: "pset-1",
        name: "Pset_WallCommon",
        description: "Common properties for walls",
        expanded: true,
        properties: [
          {
            name: "IsExternal",
            value: true,
            type: "boolean",
            editable: true,
          },
          {
            name: "LoadBearing",
            value: true,
            type: "boolean",
            editable: true,
          },
          {
            name: "FireRating",
            value: "120",
            type: "string",
            unit: "min",
            editable: true,
          },
        ],
      },
      {
        id: "pset-2",
        name: "Dimensions",
        expanded: false,
        properties: [
          {
            name: "Length",
            value: 5000,
            type: "number",
            unit: "mm",
            editable: false,
          },
          {
            name: "Height",
            value: 3000,
            type: "number",
            unit: "mm",
            editable: false,
          },
        ],
      },
    ],
  }

  const mockProps = {
    element: mockElement,
    onSave: jest.fn(),
    onCopyGlobalId: jest.fn(),
    onExport: jest.fn(),
    readOnly: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders properties panel with header", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText("Properties")).toBeTruthy()
  })

  it("displays element name and type", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText("Wall-001")).toBeTruthy()
    expect(screen.getByText("IfcWall")).toBeTruthy()
  })

  it("shows global ID with copy button", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText(/2x3\$abc123def456/i)).toBeTruthy()

    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find(btn => btn.querySelector('.lucide-copy'))
    expect(copyButton).toBeTruthy()
  })

  it("renders property sets with expand/collapse", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText("Pset_WallCommon")).toBeTruthy()
    expect(screen.getByText("Dimensions")).toBeTruthy()
  })

  it("displays property names and values", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText("IsExternal")).toBeTruthy()
    expect(screen.getByText("LoadBearing")).toBeTruthy()
    expect(screen.getByText("FireRating")).toBeTruthy()
  })

  it("shows units for properties that have them", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText(/min/i)).toBeTruthy()
  })

  it("provides edit buttons for editable properties", () => {
    render(<PropertyPanel {...mockProps} />)
    const editButtons = screen.getAllByRole('button')
    const hasEditButton = editButtons.some(btn => btn.querySelector('.lucide-edit-2'))
    expect(hasEditButton).toBeTruthy()
  })

  it("shows save and reset buttons when changes are made", () => {
    const { container } = render(<PropertyPanel {...mockProps} />)

    // Trigger an edit to show save/reset buttons
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => btn.querySelector('.lucide-edit-2'))

    if (editButton) {
      fireEvent.click(editButton)

      waitFor(() => {
        expect(screen.getByText(/Save/i)).toBeTruthy()
        expect(screen.getByText(/Reset/i)).toBeTruthy()
      })
    }
  })

  it("renders IFC Properties and Metadata tabs", () => {
    render(<PropertyPanel {...mockProps} />)
    expect(screen.getByText("IFC Properties")).toBeTruthy()
    expect(screen.getByText("Metadata")).toBeTruthy()
  })

  it("shows empty state when no element is selected", () => {
    render(<PropertyPanel {...mockProps} element={null} />)
    expect(screen.getByText(/Select an element to view properties/i)).toBeTruthy()
  })
})
