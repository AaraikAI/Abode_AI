import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { CostChart, CostCategory } from "@/components/cost/cost-chart"

describe("CostChart", () => {
  const mockCategories: CostCategory[] = [
    {
      name: "Materials",
      amount: 50000,
    },
    {
      name: "Labor",
      amount: 40000,
    },
    {
      name: "Equipment",
      amount: 10000,
    },
    {
      name: "Overhead",
      amount: 8000,
    },
  ]

  const defaultProps = {
    categories: mockCategories,
    title: "Cost Distribution",
    showLegend: true,
    showPercentages: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders cost chart header", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Cost Distribution")).toBeTruthy()
  })

  it("displays export button", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Export")).toBeTruthy()
  })

  it("shows chart type selector", () => {
    render(<CostChart {...defaultProps} variant="both" />)
    expect(screen.getByText("Chart Type")).toBeTruthy()
  })

  it("displays sort by dropdown", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Sort By")).toBeTruthy()
  })

  it("shows category breakdown when legend enabled", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Category Breakdown")).toBeTruthy()
  })

  it("displays largest category stat", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Largest Category")).toBeTruthy()
  })

  it("shows number of categories", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Number of Categories")).toBeTruthy()
  })

  it("displays average per category", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Average per Category")).toBeTruthy()
  })

  it("renders all category names", () => {
    render(<CostChart {...defaultProps} />)
    expect(screen.getByText("Materials")).toBeTruthy()
    expect(screen.getByText("Labor")).toBeTruthy()
    expect(screen.getByText("Equipment")).toBeTruthy()
  })

  it("shows no data message when categories empty", () => {
    render(<CostChart {...defaultProps} categories={[]} />)
    expect(screen.getByText("No data available")).toBeTruthy()
  })
})
