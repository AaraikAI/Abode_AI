import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { EstimateSummary, EstimateSummaryData } from "@/components/cost/estimate-summary"

describe("EstimateSummary", () => {
  const mockData: EstimateSummaryData = {
    projectId: "test-project",
    projectName: "Test Construction Project",
    costs: {
      materials: 50000,
      labor: 40000,
      equipment: 10000,
      subcontractors: 20000,
      permits: 5000,
      overhead: 8000,
      contingency: 7000,
    },
    taxRate: 8.5,
    profitMargin: 15,
    includeTax: true,
    includeProfit: true,
  }

  const mockOnChange = jest.fn()

  const defaultProps = {
    data: mockData,
    onDataChange: mockOnChange,
    editable: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders estimate summary header", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Estimate Summary")).toBeTruthy()
  })

  it("displays project name", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Test Construction Project")).toBeTruthy()
  })

  it("shows cost breakdown section", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Cost Breakdown")).toBeTruthy()
  })

  it("displays direct costs section", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Direct Costs")).toBeTruthy()
  })

  it("shows indirect costs section", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Indirect Costs")).toBeTruthy()
  })

  it("displays grand total", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Grand Total")).toBeTruthy()
  })

  it("shows profit margin card", () => {
    render(<EstimateSummary {...defaultProps} />)
    expect(screen.getByText("Profit Margin")).toBeTruthy()
  })

  it("displays settings button when editable", () => {
    render(<EstimateSummary {...defaultProps} editable={true} />)
    expect(screen.getByText("Settings")).toBeTruthy()
  })

  it("shows save estimate button when editable", () => {
    render(<EstimateSummary {...defaultProps} editable={true} />)
    expect(screen.getByText("Save Estimate")).toBeTruthy()
  })

  it("renders compact variant correctly", () => {
    render(<EstimateSummary {...defaultProps} variant="compact" />)
    expect(screen.getByText("Estimate Summary")).toBeTruthy()
    expect(screen.getByText("Subtotal")).toBeTruthy()
  })
})
