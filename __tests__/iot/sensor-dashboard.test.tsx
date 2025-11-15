import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SensorDashboard, SensorReading, HistoricalData } from "@/components/iot/sensor-dashboard"

describe("SensorDashboard", () => {
  const mockSensors: SensorReading[] = [
    {
      id: "1",
      type: "temperature",
      name: "Living Room Temp",
      value: 22.5,
      unit: "°C",
      status: "normal",
      location: "Living Room",
      lastUpdated: new Date().toISOString(),
      trend: "stable",
      min: 18,
      max: 26,
      average: 21.5,
    },
    {
      id: "2",
      type: "humidity",
      name: "Kitchen Humidity",
      value: 65,
      unit: "%",
      status: "warning",
      location: "Kitchen",
      lastUpdated: new Date().toISOString(),
      trend: "up",
      min: 40,
      max: 70,
      average: 55,
    },
    {
      id: "3",
      type: "air_quality",
      name: "Bedroom Air Quality",
      value: 85,
      unit: "AQI",
      status: "critical",
      location: "Bedroom",
      lastUpdated: new Date().toISOString(),
      trend: "down",
      min: 0,
      max: 100,
      average: 50,
    },
  ]

  const mockHistoricalData: HistoricalData[] = [
    {
      timestamp: new Date().toISOString(),
      temperature: 22,
      humidity: 60,
      airQuality: 80,
    },
  ]

  const mockProps = {
    sensors: mockSensors,
    historicalData: mockHistoricalData,
    onRefresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders sensor dashboard with total sensor count", () => {
    render(<SensorDashboard {...mockProps} />)
    expect(screen.getByText("Total Sensors")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("displays critical alerts count", () => {
    render(<SensorDashboard {...mockProps} />)
    expect(screen.getByText("Critical Alerts")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("shows warning count", () => {
    render(<SensorDashboard {...mockProps} />)
    expect(screen.getByText("Warnings")).toBeTruthy()
  })

  it("renders all tabs", () => {
    render(<SensorDashboard {...mockProps} />)
    expect(screen.getByText("Overview")).toBeTruthy()
    expect(screen.getByText("Sensors")).toBeTruthy()
    expect(screen.getByText("Trends")).toBeTruthy()
  })

  it("switches between tabs when clicked", () => {
    render(<SensorDashboard {...mockProps} />)
    const sensorsTab = screen.getByText("Sensors")
    fireEvent.click(sensorsTab)
    expect(screen.getByText("All Sensors")).toBeTruthy()
  })

  it("displays sensor readings in overview tab", () => {
    render(<SensorDashboard {...mockProps} />)
    expect(screen.getByText("Living Room Temp")).toBeTruthy()
    expect(screen.getByText("Kitchen Humidity")).toBeTruthy()
  })

  it("shows sensor status badges", () => {
    render(<SensorDashboard {...mockProps} />)
    const sensorsTab = screen.getByText("Sensors")
    fireEvent.click(sensorsTab)
    expect(screen.getByText("normal")).toBeTruthy()
    expect(screen.getByText("warning")).toBeTruthy()
    expect(screen.getByText("critical")).toBeTruthy()
  })

  it("displays sensor values with units", () => {
    render(<SensorDashboard {...mockProps} />)
    const sensorsTab = screen.getByText("Sensors")
    fireEvent.click(sensorsTab)
    expect(screen.getByText(/22.5/)).toBeTruthy()
  })

  it("renders historical trends chart", () => {
    render(<SensorDashboard {...mockProps} />)
    const trendsTab = screen.getByText("Trends")
    fireEvent.click(trendsTab)
    expect(screen.getByText("Historical Trends")).toBeTruthy()
  })

  it("shows data points count", () => {
    render(<SensorDashboard {...mockProps} />)
    expect(screen.getByText("Data Points")).toBeTruthy()
    expect(screen.getByText(mockHistoricalData.length.toString())).toBeTruthy()
  })
})
