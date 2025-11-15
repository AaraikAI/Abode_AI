import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { HVACSizing } from "@/components/energy/hvac-sizing"

describe("HVACSizing", () => {
  const mockDefaultParameters = {
    area: 2000,
    ceilingHeight: 8,
    floors: 1,
    orientation: 'north',
    climate: 'mixed-humid',
    insulation: 'standard',
    windowArea: 300,
    infiltration: 'average'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders HVAC sizing calculator with title", () => {
    render(<HVACSizing />)
    expect(screen.getByText("HVAC Sizing Calculator")).toBeTruthy()
    expect(screen.getByText(/Manual J Load Calculation/i)).toBeTruthy()
  })

  it("displays building parameters form with all inputs", () => {
    render(<HVACSizing />)
    expect(screen.getByLabelText(/Conditioned Area/i)).toBeTruthy()
    expect(screen.getByLabelText(/Ceiling Height/i)).toBeTruthy()
    expect(screen.getByLabelText(/Number of Floors/i)).toBeTruthy()
    expect(screen.getByLabelText(/Window Area/i)).toBeTruthy()
  })

  it("accepts default parameters and populates form", () => {
    render(<HVACSizing defaultParameters={mockDefaultParameters} />)
    const areaInput = screen.getByLabelText(/Conditioned Area/i) as HTMLInputElement
    expect(areaInput.value).toBe("2000")
  })

  it("updates area parameter when input changes", () => {
    render(<HVACSizing />)
    const areaInput = screen.getByLabelText(/Conditioned Area/i)
    fireEvent.change(areaInput, { target: { value: '2500' } })
    expect((areaInput as HTMLInputElement).value).toBe("2500")
  })

  it("displays climate zone selector with options", () => {
    render(<HVACSizing />)
    const climateSelect = screen.getByLabelText(/Climate Zone/i)
    expect(climateSelect).toBeTruthy()
  })

  it("shows insulation level selector", () => {
    render(<HVACSizing />)
    const insulationSelect = screen.getByLabelText(/Insulation Level/i)
    expect(insulationSelect).toBeTruthy()
  })

  it("displays calculate button", () => {
    render(<HVACSizing />)
    const calculateButton = screen.getByText(/Calculate Loads/i)
    expect(calculateButton).toBeTruthy()
  })

  it("shows placeholder message before calculation", () => {
    render(<HVACSizing />)
    expect(screen.getByText(/Enter building parameters and click Calculate/i)).toBeTruthy()
  })

  it("performs load calculation when button is clicked", () => {
    render(<HVACSizing />)
    const calculateButton = screen.getByText(/Calculate Loads/i)
    fireEvent.click(calculateButton)

    waitFor(() => {
      expect(screen.getByText("Heating Load")).toBeTruthy()
      expect(screen.getByText("Cooling Load")).toBeTruthy()
      expect(screen.getByText("Ventilation")).toBeTruthy()
    })
  })

  it("calls onCalculate callback with results", () => {
    const mockCalculate = jest.fn()
    render(<HVACSizing onCalculate={mockCalculate} />)
    const calculateButton = screen.getByText(/Calculate Loads/i)
    fireEvent.click(calculateButton)

    waitFor(() => {
      expect(mockCalculate).toHaveBeenCalled()
    })
  })
})
