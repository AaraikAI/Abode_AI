import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeviceList, IoTDevice } from "@/components/iot/device-list"

describe("DeviceList", () => {
  const mockDevices: IoTDevice[] = [
    {
      id: "1",
      name: "Smart Thermostat",
      type: "thermostat",
      status: "online",
      batteryLevel: 85,
      signalStrength: 95,
      lastSeen: new Date().toISOString(),
      location: "Living Room",
      firmware: "v2.1.0",
      uptime: 86400,
      model: "Nest Learning",
    },
    {
      id: "2",
      name: "Motion Sensor",
      type: "sensor",
      status: "offline",
      batteryLevel: 15,
      signalStrength: 45,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      location: "Hallway",
      firmware: "v1.5.2",
      uptime: 172800,
      model: "Philips Hue",
    },
    {
      id: "3",
      name: "Security Camera",
      type: "camera",
      status: "error",
      signalStrength: 80,
      lastSeen: new Date().toISOString(),
      location: "Front Door",
      firmware: "v3.0.1",
      uptime: 259200,
      model: "Ring Pro",
    },
  ]

  const mockProps = {
    devices: mockDevices,
    onDeviceSelect: jest.fn(),
    onDeviceAction: jest.fn(),
    onRefresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders device list with total count", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByText("Total Devices")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("displays online device count", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByText("Online")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("shows offline device count", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByText("Offline")).toBeTruthy()
  })

  it("displays low battery count", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByText("Low Battery")).toBeTruthy()
  })

  it("renders search input", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByPlaceholderText("Search devices...")).toBeTruthy()
  })

  it("filters devices by search query", () => {
    render(<DeviceList {...mockProps} />)
    const searchInput = screen.getByPlaceholderText("Search devices...")
    fireEvent.change(searchInput, { target: { value: "Thermostat" } })
    expect(screen.getByText("Smart Thermostat")).toBeTruthy()
  })

  it("displays device battery levels", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByText("85%")).toBeTruthy()
    expect(screen.getByText("15%")).toBeTruthy()
  })

  it("shows device signal strength", () => {
    render(<DeviceList {...mockProps} />)
    expect(screen.getByText("95%")).toBeTruthy()
  })

  it("calls refresh handler when refresh button clicked", () => {
    render(<DeviceList {...mockProps} />)
    const refreshButton = screen.getByText("Refresh")
    fireEvent.click(refreshButton)
    expect(mockProps.onRefresh).toHaveBeenCalled()
  })

  it("shows empty state when no devices match filters", () => {
    render(<DeviceList {...mockProps} />)
    const searchInput = screen.getByPlaceholderText("Search devices...")
    fireEvent.change(searchInput, { target: { value: "NonExistentDevice" } })
    expect(screen.getByText("No devices found matching your filters")).toBeTruthy()
  })
})
