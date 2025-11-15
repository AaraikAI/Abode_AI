import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { LaborBreakdown, LaborItem } from "@/components/cost/labor-breakdown"

describe("LaborBreakdown", () => {
  const mockLaborItems: LaborItem[] = [
    {
      id: "1",
      trade: "Carpenter",
      description: "Framing work",
      workers: 4,
      hours: 40,
      ratePerHour: 35,
      totalCost: 5600,
    },
    {
      id: "2",
      trade: "Electrician",
      description: "Rough-in electrical",
      workers: 2,
      hours: 32,
      ratePerHour: 45,
      overtimeHours: 8,
      overtimeRate: 67.5,
      totalCost: 3960,
    },
  ]

  const mockOnChange = jest.fn()

  const defaultProps = {
    projectId: "test-project",
    laborItems: mockLaborItems,
    onLaborChange: mockOnChange,
    editable: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders labor breakdown header", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Labor Breakdown")).toBeTruthy()
  })

  it("displays labor items in table", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Framing work")).toBeTruthy()
    expect(screen.getByText("Rough-in electrical")).toBeTruthy()
  })

  it("shows total labor cost summary card", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Total Labor Cost")).toBeTruthy()
  })

  it("displays total hours summary card", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Total Hours")).toBeTruthy()
  })

  it("shows regular hours summary", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Regular Hours")).toBeTruthy()
  })

  it("displays overtime hours summary", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Overtime Hours")).toBeTruthy()
  })

  it("shows add labor item button when editable", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Add Labor Item")).toBeTruthy()
  })

  it("displays export button", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Export")).toBeTruthy()
  })

  it("shows details and summary tabs", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Details")).toBeTruthy()
    expect(screen.getByText("Summary by Trade")).toBeTruthy()
  })

  it("displays trade filter dropdown", () => {
    render(<LaborBreakdown {...defaultProps} />)
    expect(screen.getByText("Filter by Trade")).toBeTruthy()
  })
})
