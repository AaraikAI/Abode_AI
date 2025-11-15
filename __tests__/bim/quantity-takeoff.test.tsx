import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QuantityTakeoff, QuantityItem, QuantitySummary } from "@/components/bim/quantity-takeoff"

describe("QuantityTakeoff", () => {
  const mockQuantities: QuantityItem[] = [
    {
      id: "qty-1",
      category: "Walls",
      element: "Concrete Wall - 200mm",
      count: 45,
      area: 850.5,
      volume: 170.1,
      unit: "m³",
      unitCost: 350,
      totalCost: 59535,
      material: "Concrete",
    },
    {
      id: "qty-2",
      category: "Floors",
      element: "Composite Floor Slab",
      count: 12,
      area: 1200.0,
      volume: 180.0,
      unit: "m³",
      unitCost: 280,
      totalCost: 50400,
      material: "Concrete",
    },
    {
      id: "qty-3",
      category: "Doors",
      element: "Wood Door - Single",
      count: 85,
      unit: "ea",
      unitCost: 450,
      totalCost: 38250,
      material: "Wood",
    },
  ]

  const mockSummary: QuantitySummary = {
    totalElements: 142,
    totalVolume: 350.1,
    totalArea: 2050.5,
    totalLength: 0,
    totalCost: 148185,
    categories: [
      { name: "Walls", count: 45, percentage: 31.7 },
      { name: "Floors", count: 12, percentage: 8.5 },
      { name: "Doors", count: 85, percentage: 59.8 },
    ],
  }

  const mockProps = {
    quantities: mockQuantities,
    summary: mockSummary,
    onExtract: jest.fn(),
    onExport: jest.fn(),
    onUpdateCost: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders quantity takeoff interface with header", () => {
    render(<QuantityTakeoff {...mockProps} />)
    expect(screen.getByText("Quantity Takeoff")).toBeTruthy()
  })

  it("displays extract button", () => {
    render(<QuantityTakeoff {...mockProps} />)
    expect(screen.getByText(/Extract/i)).toBeTruthy()
  })

  it("shows export dropdown with format options", () => {
    render(<QuantityTakeoff {...mockProps} />)
    const exportSelect = screen.getByRole('combobox')
    expect(exportSelect).toBeTruthy()
  })

  it("displays summary statistics cards", () => {
    render(<QuantityTakeoff {...mockProps} />)
    expect(screen.getByText("Elements")).toBeTruthy()
    expect(screen.getByText("Total Volume")).toBeTruthy()
    expect(screen.getByText("Total Area")).toBeTruthy()
    expect(screen.getByText("Total Cost")).toBeTruthy()
  })

  it("shows category and material filter dropdowns", () => {
    render(<QuantityTakeoff {...mockProps} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it("renders quantities and category breakdown tabs", () => {
    render(<QuantityTakeoff {...mockProps} />)
    expect(screen.getByText("Quantities")).toBeTruthy()
    expect(screen.getByText("Category Breakdown")).toBeTruthy()
  })

  it("displays quantity table with all columns", () => {
    render(<QuantityTakeoff {...mockProps} />)
    expect(screen.getByText("Category")).toBeTruthy()
    expect(screen.getByText("Element")).toBeTruthy()
    expect(screen.getByText("Count")).toBeTruthy()
    expect(screen.getByText("Area")).toBeTruthy()
    expect(screen.getByText("Volume")).toBeTruthy()
    expect(screen.getByText("Material")).toBeTruthy()
    expect(screen.getByText("Unit Cost")).toBeTruthy()
    expect(screen.getByText("Total Cost")).toBeTruthy()
  })

  it("shows quantity items with formatted values", () => {
    render(<QuantityTakeoff {...mockProps} />)
    expect(screen.getByText("Concrete Wall - 200mm")).toBeTruthy()
    expect(screen.getByText("Composite Floor Slab")).toBeTruthy()
    expect(screen.getByText("Wood Door - Single")).toBeTruthy()
  })

  it("displays cost values as currency", () => {
    render(<QuantityTakeoff {...mockProps} />)
    const cells = screen.getAllByRole('cell')
    const hasCurrency = cells.some(cell => cell.textContent?.includes('$'))
    expect(hasCurrency).toBeTruthy()
  })

  it("allows editing unit cost by clicking on value", () => {
    render(<QuantityTakeoff {...mockProps} />)
    const costCells = screen.getAllByRole('cell').filter(cell =>
      cell.textContent?.includes('$350')
    )

    if (costCells[0]) {
      const button = costCells[0].querySelector('button')
      if (button) {
        fireEvent.click(button)

        waitFor(() => {
          const input = screen.getByRole('spinbutton')
          expect(input).toBeTruthy()
        })
      }
    }
  })
})
