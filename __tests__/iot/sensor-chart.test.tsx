import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SensorChart, SensorDataPoint, SensorMetadata } from "@/components/iot/sensor-chart"

describe("SensorChart", () => {
  const mockData: SensorDataPoint[] = [
    {
      timestamp: new Date().toISOString(),
      value: 22.5,
      min: 20,
      max: 25,
      average: 22,
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      value: 23.1,
      min: 21,
      max: 24,
      average: 22.5,
    },
  ]

  const mockMetadata: SensorMetadata = {
    sensorId: "sensor-1",
    sensorName: "Temperature Sensor",
    type: "temperature",
    unit: "°C",
    location: "Living Room",
    thresholds: {
      min: 18,
      max: 28,
      warning: 26,
      critical: 30,
    },
  }

  const mockProps = {
    data: mockData,
    metadata: mockMetadata,
    onExport: jest.fn(),
    onTimeRangeChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders sensor chart with sensor name", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Temperature Sensor")).toBeTruthy()
  })

  it("displays current value stat", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Current")).toBeTruthy()
  })

  it("shows average value", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Average")).toBeTruthy()
  })

  it("displays minimum value", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Minimum")).toBeTruthy()
  })

  it("shows maximum value", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Maximum")).toBeTruthy()
  })

  it("renders time range selector", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Last 24 Hours")).toBeTruthy()
  })

  it("calls onTimeRangeChange when range is changed", () => {
    render(<SensorChart {...mockProps} />)
    const selector = screen.getByText("Last 24 Hours")
    fireEvent.click(selector)
    const option = screen.getByText("Last Hour")
    fireEvent.click(option)
    expect(mockProps.onTimeRangeChange).toHaveBeenCalledWith("1h")
  })

  it("displays chart type selector", () => {
    render(<SensorChart {...mockProps} />)
    expect(screen.getByText("Line Chart")).toBeTruthy()
  })

  it("calls export handler when export button clicked", () => {
    render(<SensorChart {...mockProps} />)
    const exportButton = screen.getByText("Export")
    fireEvent.click(exportButton)
    expect(mockProps.onExport).toHaveBeenCalled()
  })

  it("shows threshold configuration when enabled", () => {
    render(<SensorChart {...mockProps} showThresholds={true} />)
    expect(screen.getByText("Threshold Configuration")).toBeTruthy()
  })
})
