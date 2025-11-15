import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SolarAnalysis } from "@/components/energy/solar-analysis"

describe("SolarAnalysis", () => {
  const mockDefaultParameters = {
    roofArea: 1500,
    roofPitch: 30,
    azimuth: 180,
    latitude: 40,
    longitude: -75,
    shadingFactor: 85,
    annualConsumption: 12000,
    electricityRate: 0.13,
    panelEfficiency: 20,
    systemSize: 8
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders solar analysis component with title", () => {
    render(<SolarAnalysis />)
    expect(screen.getByText("Solar Analysis")).toBeTruthy()
    expect(screen.getByText(/Solar Panel Assessment/i)).toBeTruthy()
  })

  it("displays system parameters form", () => {
    render(<SolarAnalysis />)
    expect(screen.getByLabelText(/System Size/i)).toBeTruthy()
    expect(screen.getByLabelText(/Usable Roof Area/i)).toBeTruthy()
    expect(screen.getByLabelText(/Annual Consumption/i)).toBeTruthy()
  })

  it("accepts default parameters", () => {
    render(<SolarAnalysis defaultParameters={mockDefaultParameters} />)
    const roofAreaInput = screen.getByLabelText(/Usable Roof Area/i) as HTMLInputElement
    expect(roofAreaInput.value).toBe("1500")
  })

  it("displays azimuth slider with orientation label", () => {
    render(<SolarAnalysis />)
    expect(screen.getByText(/Azimuth:/i)).toBeTruthy()
    expect(screen.getByText(/South/i)).toBeTruthy()
  })

  it("displays shading factor slider", () => {
    render(<SolarAnalysis />)
    expect(screen.getByText(/Shading Factor/i)).toBeTruthy()
  })

  it("shows analyze button", () => {
    render(<SolarAnalysis />)
    const analyzeButton = screen.getByText(/Analyze Solar Potential/i)
    expect(analyzeButton).toBeTruthy()
  })

  it("displays placeholder before analysis", () => {
    render(<SolarAnalysis />)
    expect(screen.getByText(/Configure system parameters and click Analyze/i)).toBeTruthy()
  })

  it("performs solar analysis when button clicked", () => {
    render(<SolarAnalysis />)
    const analyzeButton = screen.getByText(/Analyze Solar Potential/i)
    fireEvent.click(analyzeButton)

    waitFor(() => {
      expect(screen.getByText("Annual Production")).toBeTruthy()
      expect(screen.getByText("Annual Savings")).toBeTruthy()
      expect(screen.getByText("Payback Period")).toBeTruthy()
    })
  })

  it("displays production, financial, and orientation tabs after analysis", () => {
    render(<SolarAnalysis />)
    const analyzeButton = screen.getByText(/Analyze Solar Potential/i)
    fireEvent.click(analyzeButton)

    waitFor(() => {
      expect(screen.getByText("Production")).toBeTruthy()
      expect(screen.getByText("Financial")).toBeTruthy()
      expect(screen.getByText("Orientation")).toBeTruthy()
    })
  })

  it("calls onAnalyze callback with results", () => {
    const mockAnalyze = jest.fn()
    render(<SolarAnalysis onAnalyze={mockAnalyze} />)
    const analyzeButton = screen.getByText(/Analyze Solar Potential/i)
    fireEvent.click(analyzeButton)

    waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalled()
    })
  })
})
