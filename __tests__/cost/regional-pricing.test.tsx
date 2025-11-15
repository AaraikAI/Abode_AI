import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { RegionalPricing } from "@/components/cost/regional-pricing"

describe("RegionalPricing", () => {
  const mockOnLocationChange = jest.fn()

  const defaultProps = {
    projectId: "test-project",
    baseCost: 100000,
    onLocationChange: mockOnLocationChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders regional pricing header", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Regional Pricing")).toBeTruthy()
  })

  it("displays project location section", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Project Location")).toBeTruthy()
  })

  it("shows city input field", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByPlaceholderText("Enter city")).toBeTruthy()
  })

  it("displays state selector", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("State *")).toBeTruthy()
  })

  it("shows zip code input", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByPlaceholderText("12345")).toBeTruthy()
  })

  it("displays get regional factors button", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Get Regional Factors")).toBeTruthy()
  })

  it("shows regional cost index section", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Regional Cost Index")).toBeTruthy()
  })

  it("displays cost factors by category", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Cost Factors by Category")).toBeTruthy()
  })

  it("shows custom adjustments section", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Custom Adjustments")).toBeTruthy()
  })

  it("displays cost impact summary", () => {
    render(<RegionalPricing {...defaultProps} />)
    expect(screen.getByText("Cost Impact Summary")).toBeTruthy()
  })
})
