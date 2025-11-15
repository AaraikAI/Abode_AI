import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BuildingEnvelope } from "@/components/energy/building-envelope"

describe("BuildingEnvelope", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders building envelope analysis component", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByText("Building Envelope Analysis")).toBeTruthy()
    expect(screen.getByText(/Thermal Performance/i)).toBeTruthy()
  })

  it("displays all envelope components", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByText("Exterior Walls")).toBeTruthy()
    expect(screen.getByText("Roof/Ceiling")).toBeTruthy()
    expect(screen.getByText("Foundation/Floor")).toBeTruthy()
    expect(screen.getByText("Windows")).toBeTruthy()
  })

  it("shows component R-values", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByText(/R-13/i)).toBeTruthy()
    expect(screen.getByText(/R-30/i)).toBeTruthy()
  })

  it("allows selecting different envelope components", () => {
    render(<BuildingEnvelope />)
    const windowsButton = screen.getByText("Windows")
    fireEvent.click(windowsButton)
    expect(screen.getByText("Configuration and properties")).toBeTruthy()
  })

  it("displays area input for selected component", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByLabelText(/Area \(sq ft\)/i)).toBeTruthy()
  })

  it("shows assembly type selector", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByLabelText(/Assembly Type/i)).toBeTruthy()
  })

  it("displays R-value and U-value inputs", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByLabelText(/R-Value/i)).toBeTruthy()
  })

  it("shows thermal bridging percentage input", () => {
    render(<BuildingEnvelope />)
    expect(screen.getByLabelText(/Thermal Bridging/i)).toBeTruthy()
  })

  it("performs envelope analysis when button clicked", () => {
    render(<BuildingEnvelope />)
    const analyzeButton = screen.getByText(/Analyze Performance/i)
    fireEvent.click(analyzeButton)

    waitFor(() => {
      expect(screen.getByText("Avg R-Value")).toBeTruthy()
      expect(screen.getByText("Annual Cost")).toBeTruthy()
      expect(screen.getByText("Carbon Impact")).toBeTruthy()
    })
  })

  it("calls onAnalyze callback with thermal analysis results", () => {
    const mockAnalyze = jest.fn()
    render(<BuildingEnvelope onAnalyze={mockAnalyze} />)
    const analyzeButton = screen.getByText(/Analyze Performance/i)
    fireEvent.click(analyzeButton)

    waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalled()
    })
  })
})
