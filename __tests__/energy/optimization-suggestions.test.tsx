import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { OptimizationSuggestions } from "@/components/energy/optimization-suggestions"

describe("OptimizationSuggestions", () => {
  const mockBuildingData = {
    type: 'commercial',
    area: 10000,
    age: 15,
    currentEUI: 75,
    targetEUI: 50
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders optimization suggestions component", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText("Energy Optimization")).toBeTruthy()
    expect(screen.getByText(/AI-powered recommendations/i)).toBeTruthy()
  })

  it("displays total potential savings metric", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText("Total Potential Savings")).toBeTruthy()
  })

  it("shows energy reduction metric", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText("Energy Reduction")).toBeTruthy()
  })

  it("displays implementation cost summary", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText("Implementation Cost")).toBeTruthy()
  })

  it("shows carbon reduction total", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText("Carbon Reduction")).toBeTruthy()
  })

  it("displays category filter dropdown", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText(/All Categories/i)).toBeTruthy()
  })

  it("shows sort options", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText(/Impact Score/i)).toBeTruthy()
  })

  it("renders multiple suggestion cards", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    expect(screen.getByText(/Upgrade to High-Efficiency Heat Pump/i)).toBeTruthy()
    expect(screen.getByText(/Complete LED Retrofit/i)).toBeTruthy()
  })

  it("displays priority badges on suggestions", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    const highBadges = screen.getAllByText("high")
    expect(highBadges.length).toBeGreaterThan(0)
  })

  it("expands suggestion details when clicked", () => {
    render(<OptimizationSuggestions buildingData={mockBuildingData} />)
    const expandButtons = screen.getAllByRole('button')
    const firstExpandButton = expandButtons.find(btn =>
      btn.querySelector('.lucide-chevron-down')
    )

    if (firstExpandButton) {
      fireEvent.click(firstExpandButton)
      waitFor(() => {
        expect(screen.getByText("Implementation Steps")).toBeTruthy()
      })
    }
  })
})
