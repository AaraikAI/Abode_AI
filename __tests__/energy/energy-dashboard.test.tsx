import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EnergyDashboard } from "@/components/energy/energy-dashboard"

describe("EnergyDashboard", () => {
  const mockProps = {
    buildingName: "Test Building",
    buildingArea: 10000,
    currentConsumption: {
      current: 50000,
      previous: 55000,
      percentChange: -9.1,
      trend: 'down' as const
    },
    currentCost: {
      current: 6500,
      previous: 7150,
      percentChange: -9.1,
      trend: 'down' as const
    },
    monthlyData: [
      {
        month: 'Jan',
        consumption: 4500,
        cost: 585,
        baseline: 5000,
        target: 4000
      },
      {
        month: 'Feb',
        consumption: 4200,
        cost: 546,
        baseline: 4800,
        target: 3800
      }
    ],
    categoryBreakdown: [
      { category: 'HVAC', value: 25000, percentage: 50, color: '#8b5cf6' },
      { category: 'Lighting', value: 15000, percentage: 30, color: '#f59e0b' },
      { category: 'Equipment', value: 10000, percentage: 20, color: '#10b981' }
    ],
    comparisons: [
      { building: 'Building A', eui: 65, cost: 8500, rating: 'B' },
      { building: 'Building B', eui: 58, cost: 7500, rating: 'A' }
    ],
    lastUpdated: '2 hours ago'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders dashboard with building name and area", () => {
    render(<EnergyDashboard {...mockProps} />)
    expect(screen.getByText("Test Building")).toBeTruthy()
    expect(screen.getByText(/10,000 sq ft/i)).toBeTruthy()
  })

  it("displays total consumption metric", () => {
    render(<EnergyDashboard {...mockProps} />)
    expect(screen.getByText("Total Consumption")).toBeTruthy()
    expect(screen.getByText(/50,000 kWh/i)).toBeTruthy()
  })

  it("shows energy cost with correct formatting", () => {
    render(<EnergyDashboard {...mockProps} />)
    expect(screen.getByText("Energy Cost")).toBeTruthy()
    expect(screen.getByText(/\$6,500/i)).toBeTruthy()
  })

  it("displays trend indicators correctly", () => {
    render(<EnergyDashboard {...mockProps} />)
    expect(screen.getByText("9.1%")).toBeTruthy()
    expect(screen.getByText(/vs last period/i)).toBeTruthy()
  })

  it("calculates and displays EUI correctly", () => {
    render(<EnergyDashboard {...mockProps} />)
    expect(screen.getByText("Energy Use Intensity")).toBeTruthy()
    // EUI = 50000 / 10000 = 5.0 kWh/sf
    expect(screen.getByText(/5\.0/)).toBeTruthy()
  })

  it("renders all tab options", () => {
    render(<EnergyDashboard {...mockProps} />)
    expect(screen.getByText("Overview")).toBeTruthy()
    expect(screen.getByText("Breakdown")).toBeTruthy()
    expect(screen.getByText("Trends")).toBeTruthy()
    expect(screen.getByText("Comparison")).toBeTruthy()
  })

  it("switches between tabs when clicked", () => {
    render(<EnergyDashboard {...mockProps} />)
    const breakdownTab = screen.getByText("Breakdown")
    fireEvent.click(breakdownTab)
    expect(screen.getByText("Detailed Energy Breakdown")).toBeTruthy()
  })

  it("displays category breakdown with percentages", () => {
    render(<EnergyDashboard {...mockProps} />)
    const breakdownTab = screen.getByText("Breakdown")
    fireEvent.click(breakdownTab)
    expect(screen.getByText("HVAC")).toBeTruthy()
    expect(screen.getByText("Lighting")).toBeTruthy()
    expect(screen.getByText("Equipment")).toBeTruthy()
  })

  it("calls onRefresh when refresh button is clicked", () => {
    const mockRefresh = jest.fn()
    render(<EnergyDashboard {...mockProps} onRefresh={mockRefresh} />)
    const refreshButton = screen.getByText("Refresh")
    fireEvent.click(refreshButton)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it("calls onExport when export button is clicked", () => {
    const mockExport = jest.fn()
    render(<EnergyDashboard {...mockProps} onExport={mockExport} />)
    const exportButton = screen.getByText("Export")
    fireEvent.click(exportButton)
    expect(mockExport).toHaveBeenCalledTimes(1)
  })
})
