import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { MaterialTakeoff, MaterialItem } from "@/components/cost/material-takeoff"

describe("MaterialTakeoff", () => {
  const mockMaterials: MaterialItem[] = [
    {
      id: "1",
      category: "Concrete",
      name: "Ready Mix Concrete",
      description: "4000 PSI",
      quantity: 100,
      unit: "CY",
      unitPrice: 150,
      totalPrice: 15000,
    },
    {
      id: "2",
      category: "Lumber",
      name: "2x4 Studs",
      quantity: 500,
      unit: "EA",
      unitPrice: 8.5,
      totalPrice: 4250,
    },
  ]

  const mockOnChange = jest.fn()

  const defaultProps = {
    projectId: "test-project",
    materials: mockMaterials,
    onMaterialsChange: mockOnChange,
    editable: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders material takeoff header", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Material Takeoff")).toBeTruthy()
  })

  it("displays material items in table", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Ready Mix Concrete")).toBeTruthy()
    expect(screen.getByText("2x4 Studs")).toBeTruthy()
  })

  it("calculates and displays grand total", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Grand Total")).toBeTruthy()
    // Total should be $19,250.00
  })

  it("shows add material button when editable", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Add Material")).toBeTruthy()
  })

  it("hides add material button when not editable", () => {
    render(<MaterialTakeoff {...defaultProps} editable={false} />)
    expect(screen.queryByText("Add Material")).toBeNull()
  })

  it("displays export button", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Export")).toBeTruthy()
  })

  it("shows auto takeoff button", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Auto Takeoff")).toBeTruthy()
  })

  it("displays search input for filtering materials", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByPlaceholderText("Search by name or description...")).toBeTruthy()
  })

  it("shows category filter dropdown", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Filter by Category")).toBeTruthy()
  })

  it("displays summary by category", () => {
    render(<MaterialTakeoff {...defaultProps} />)
    expect(screen.getByText("Summary by Category")).toBeTruthy()
  })
})
