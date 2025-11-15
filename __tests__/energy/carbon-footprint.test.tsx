import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CarbonFootprint } from "@/components/energy/carbon-footprint"

describe("CarbonFootprint", () => {
  const mockProps = {
    currentEmissions: {
      electricity: 8000,
      naturalGas: 3000,
      fuel: 500,
      total: 11500
    },
    monthlyData: [
      {
        month: 'Jan',
        electricity: 700,
        gas: 300,
        fuel: 50,
        total: 1050,
        target: 900
      },
      {
        month: 'Feb',
        electricity: 650,
        gas: 280,
        fuel: 45,
        total: 975,
        target: 900
      }
    ],
    targets: [
      {
        year: 2030,
        targetReduction: 50,
        actualReduction: 15,
        status: 'on-track' as const
      }
    ],
    baselineYear: 2020,
    targetYear: 2030
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders carbon footprint component", () => {
    render(<CarbonFootprint {...mockProps} />)
    expect(screen.getByText("Carbon Footprint")).toBeTruthy()
    expect(screen.getByText(/Emissions Tracking/i)).toBeTruthy()
  })

  it("displays annual emissions metric", () => {
    render(<CarbonFootprint {...mockProps} />)
    expect(screen.getByText("Annual Emissions")).toBeTruthy()
    expect(screen.getByText(/tons CO₂/i)).toBeTruthy()
  })

  it("shows target progress metric", () => {
    render(<CarbonFootprint {...mockProps} />)
    expect(screen.getByText("Target Progress")).toBeTruthy()
  })

  it("displays per square foot emissions", () => {
    render(<CarbonFootprint {...mockProps} />)
    expect(screen.getByText("Per Sq Ft")).toBeTruthy()
  })

  it("shows reduction status badge", () => {
    render(<CarbonFootprint {...mockProps} />)
    expect(screen.getByText("Reduction Status")).toBeTruthy()
    expect(screen.getByText("on-track")).toBeTruthy()
  })

  it("renders overview, breakdown, targets, and equivalents tabs", () => {
    render(<CarbonFootprint {...mockProps} />)
    expect(screen.getByText("Overview")).toBeTruthy()
    expect(screen.getByText("Breakdown")).toBeTruthy()
    expect(screen.getByText("Targets")).toBeTruthy()
    expect(screen.getByText("Equivalents")).toBeTruthy()
  })

  it("switches to breakdown tab and shows emissions sources", () => {
    render(<CarbonFootprint {...mockProps} />)
    const breakdownTab = screen.getByText("Breakdown")
    fireEvent.click(breakdownTab)

    waitFor(() => {
      expect(screen.getByText("Emissions by Source")).toBeTruthy()
    })
  })

  it("displays target setting controls in targets tab", () => {
    render(<CarbonFootprint {...mockProps} />)
    const targetsTab = screen.getByText("Targets")
    fireEvent.click(targetsTab)

    waitFor(() => {
      expect(screen.getByText("Set Reduction Target")).toBeTruthy()
      expect(screen.getByLabelText(/Target Reduction/i)).toBeTruthy()
    })
  })

  it("shows carbon equivalents in equivalents tab", () => {
    render(<CarbonFootprint {...mockProps} />)
    const equivalentsTab = screen.getByText("Equivalents")
    fireEvent.click(equivalentsTab)

    waitFor(() => {
      expect(screen.getByText("Carbon Equivalents")).toBeTruthy()
      expect(screen.getByText(/Trees Needed/i)).toBeTruthy()
    })
  })

  it("calls onSetTarget when target is set", () => {
    const mockSetTarget = jest.fn()
    render(<CarbonFootprint {...mockProps} onSetTarget={mockSetTarget} />)
    const targetsTab = screen.getByText("Targets")
    fireEvent.click(targetsTab)

    waitFor(() => {
      const setButton = screen.getByText(/Set Target/i)
      fireEvent.click(setButton)
      expect(mockSetTarget).toHaveBeenCalled()
    })
  })
})
