import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { DeviceManager, DeviceSession } from "@/components/mobile/device-manager"

describe("DeviceManager", () => {
  const mockDevices: DeviceSession[] = [
    {
      id: "session-1",
      deviceId: "device-1",
      deviceName: "iPhone 14 Pro",
      deviceType: "mobile",
      platform: "ios",
      browser: "Safari",
      appVersion: "2.1.0",
      isCurrentDevice: true,
      isTrusted: true,
      status: "active",
      lastActive: new Date().toISOString(),
      lastLocation: {
        city: "San Francisco",
        country: "USA"
      },
      ipAddress: "192.168.1.100",
      batteryLevel: 85,
      networkType: "wifi",
      sessionStart: new Date().toISOString(),
      loginMethod: "biometric"
    },
    {
      id: "session-2",
      deviceId: "device-2",
      deviceName: "MacBook Pro",
      deviceType: "desktop",
      platform: "macos",
      browser: "Chrome",
      isCurrentDevice: false,
      isTrusted: true,
      status: "idle",
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      lastLocation: {
        city: "New York",
        country: "USA"
      },
      sessionStart: new Date().toISOString(),
      loginMethod: "password"
    },
    {
      id: "session-3",
      deviceId: "device-3",
      deviceName: "iPad Air",
      deviceType: "tablet",
      platform: "ios",
      isCurrentDevice: false,
      isTrusted: false,
      status: "offline",
      lastActive: new Date(Date.now() - 86400000).toISOString(),
      sessionStart: new Date().toISOString(),
      loginMethod: "password"
    }
  ]

  const mockOnLogoutDevice = jest.fn()
  const mockOnRemoveDevice = jest.fn()
  const mockOnTrustDevice = jest.fn()
  const mockOnRefresh = jest.fn()

  const defaultProps = {
    currentDeviceId: "device-1",
    devices: mockDevices,
    onLogoutDevice: mockOnLogoutDevice,
    onRemoveDevice: mockOnRemoveDevice,
    onTrustDevice: mockOnTrustDevice,
    onRefresh: mockOnRefresh
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders device manager header", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("Active Devices")).toBeTruthy()
  })

  it("displays total devices count", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("Total Devices")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("shows active devices count", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("Active Now")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("displays trusted devices count", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("Trusted")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("renders all device sessions", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("iPhone 14 Pro")).toBeTruthy()
    expect(screen.getByText("MacBook Pro")).toBeTruthy()
    expect(screen.getByText("iPad Air")).toBeTruthy()
  })

  it("shows this device badge for current device", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("This Device")).toBeTruthy()
  })

  it("displays refresh button", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("Refresh")).toBeTruthy()
  })

  it("shows logout all others button when multiple devices exist", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("Logout All Others")).toBeTruthy()
  })

  it("displays device status badges", () => {
    render(<DeviceManager {...defaultProps} />)
    expect(screen.getByText("active")).toBeTruthy()
    expect(screen.getByText("idle")).toBeTruthy()
    expect(screen.getByText("offline")).toBeTruthy()
  })

  it("shows recent security activity section when events provided", () => {
    const securityEvents = [
      {
        id: "event-1",
        type: "login" as const,
        deviceId: "device-1",
        deviceName: "iPhone 14 Pro",
        timestamp: new Date().toISOString(),
        success: true
      }
    ]
    render(<DeviceManager {...defaultProps} securityEvents={securityEvents} />)
    expect(screen.getByText("Recent Security Activity")).toBeTruthy()
  })
})
