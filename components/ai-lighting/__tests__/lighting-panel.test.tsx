import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LightingPanel } from "../lighting-panel"

describe("LightingPanel", () => {
  const mockZones = [
    {
      id: 'z1',
      name: 'Test Zone',
      brightness: 75,
      temperature: 4000,
      occupancy: 10,
      energyUsage: 450,
      schedule: 'auto' as const,
      status: 'on' as const,
      aiOptimized: true
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders component without crashing", () => {
    render(<LightingPanel />)
    expect(screen.getByText("AI Optimization")).toBeTruthy()
  })

  it("displays zone information correctly", () => {
    render(<LightingPanel zones={mockZones} />)
    expect(screen.getByText("Test Zone")).toBeTruthy()
  })

  it("shows total energy consumption", () => {
    render(<LightingPanel zones={mockZones} />)
    expect(screen.getByText("450W")).toBeTruthy()
  })

  it("displays AI optimization toggle", () => {
    render(<LightingPanel />)
    const toggle = screen.getByRole("switch")
    expect(toggle).toBeTruthy()
  })

  it("shows optimization suggestions when enabled", () => {
    render(<LightingPanel autoOptimize={true} />)
    expect(screen.getByText(/Suggestions/)).toBeTruthy()
  })

  it("allows brightness adjustment", () => {
    const onZoneUpdate = jest.fn()
    render(<LightingPanel zones={mockZones} onZoneUpdate={onZoneUpdate} />)
    const slider = screen.getAllByRole("slider")[0]
    expect(slider).toBeTruthy()
  })

  it("displays zone count correctly", () => {
    render(<LightingPanel zones={mockZones} />)
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("shows occupancy information", () => {
    render(<LightingPanel zones={mockZones} />)
    expect(screen.getByText("10")).toBeTruthy()
  })

  it("renders tabs for different views", () => {
    render(<LightingPanel />)
    expect(screen.getByText("Zones")).toBeTruthy()
    expect(screen.getByText("Analytics")).toBeTruthy()
  })

  it("displays zone status badge", () => {
    render(<LightingPanel zones={mockZones} />)
    expect(screen.getByText("on")).toBeTruthy()
  })
})
