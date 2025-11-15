import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EnergyOptimization, EnergyMetrics, OptimizationSuggestion, EnergyUsageData } from "@/components/iot/energy-optimization"

describe("EnergyOptimization", () => {
  const mockMetrics: EnergyMetrics = {
    currentUsage: 150,
    peakUsage: 200,
    averageUsage: 140,
    totalCost: 1200,
    projectedCost: 1100,
    potentialSavings: 250,
    efficiencyScore: 75,
    carbonFootprint: 500,
  }

  const mockSuggestions: OptimizationSuggestion[] = [
    {
      id: "1",
      category: "hvac",
      title: "Optimize HVAC Schedule",
      description: "Adjust heating/cooling schedule based on occupancy patterns",
      impact: "high",
      estimatedSavings: 150,
      savingsPercentage: 12.5,
      implementationCost: 0,
      paybackPeriod: 0,
      implemented: false,
      autoImplementable: true,
      priority: 5,
    },
    {
      id: "2",
      category: "lighting",
      title: "Install LED Bulbs",
      description: "Replace incandescent bulbs with LED alternatives",
      impact: "medium",
      estimatedSavings: 80,
      savingsPercentage: 6.7,
      implementationCost: 500,
      paybackPeriod: 6.25,
      implemented: true,
      autoImplementable: false,
      priority: 3,
    },
  ]

  const mockUsageData: EnergyUsageData[] = [
    {
      timestamp: new Date().toISOString(),
      usage: 150,
      optimized: 130,
      baseline: 160,
      cost: 50,
    },
  ]

  const mockProps = {
    metrics: mockMetrics,
    suggestions: mockSuggestions,
    usageData: mockUsageData,
    autoOptimizationEnabled: false,
    onToggleAutoOptimization: jest.fn(),
    onImplementSuggestion: jest.fn(),
    onDismissSuggestion: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders energy optimization dashboard", () => {
    render(<EnergyOptimization {...mockProps} />)
    expect(screen.getByText("Current Usage")).toBeTruthy()
  })

  it("displays potential savings", () => {
    render(<EnergyOptimization {...mockProps} />)
    expect(screen.getByText("Potential Savings")).toBeTruthy()
    expect(screen.getByText("$250")).toBeTruthy()
  })

  it("shows efficiency score", () => {
    render(<EnergyOptimization {...mockProps} />)
    expect(screen.getByText("Efficiency Score")).toBeTruthy()
    expect(screen.getByText("75%")).toBeTruthy()
  })

  it("displays carbon footprint", () => {
    render(<EnergyOptimization {...mockProps} />)
    expect(screen.getByText("Carbon Footprint")).toBeTruthy()
  })

  it("renders auto-optimization toggle", () => {
    render(<EnergyOptimization {...mockProps} />)
    expect(screen.getByText("Auto-Optimization")).toBeTruthy()
  })

  it("calls onToggleAutoOptimization when switch is toggled", () => {
    render(<EnergyOptimization {...mockProps} />)
    const toggle = screen.getByRole("switch", { name: /auto-opt/i })
    fireEvent.click(toggle)
    expect(mockProps.onToggleAutoOptimization).toHaveBeenCalled()
  })

  it("displays all suggestion items", () => {
    render(<EnergyOptimization {...mockProps} />)
    const suggestionsTab = screen.getByText("Suggestions")
    fireEvent.click(suggestionsTab)
    expect(screen.getByText("Optimize HVAC Schedule")).toBeTruthy()
    expect(screen.getByText("Install LED Bulbs")).toBeTruthy()
  })

  it("shows implement button for pending suggestions", () => {
    render(<EnergyOptimization {...mockProps} />)
    const suggestionsTab = screen.getByText("Suggestions")
    fireEvent.click(suggestionsTab)
    expect(screen.getByText("Implement")).toBeTruthy()
  })

  it("calls onImplementSuggestion when implement button clicked", () => {
    render(<EnergyOptimization {...mockProps} />)
    const suggestionsTab = screen.getByText("Suggestions")
    fireEvent.click(suggestionsTab)
    const implementButton = screen.getByText("Implement")
    fireEvent.click(implementButton)
    expect(mockProps.onImplementSuggestion).toHaveBeenCalledWith("1")
  })

  it("switches between tabs", () => {
    render(<EnergyOptimization {...mockProps} />)
    const analyticsTab = screen.getByText("Analytics")
    fireEvent.click(analyticsTab)
    expect(screen.getByText("Cost Analysis")).toBeTruthy()
  })
})
