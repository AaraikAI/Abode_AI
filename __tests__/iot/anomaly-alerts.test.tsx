import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AnomalyAlerts, AnomalyAlert } from "@/components/iot/anomaly-alerts"

describe("AnomalyAlerts", () => {
  const mockAlerts: AnomalyAlert[] = [
    {
      id: "1",
      type: "critical",
      title: "Temperature Spike Detected",
      description: "Abnormal temperature increase in server room",
      sensorId: "temp-1",
      sensorName: "Server Room Temp",
      location: "Server Room",
      detectedAt: new Date().toISOString(),
      value: 35,
      expectedValue: 22,
      threshold: 28,
      unit: "°C",
      confidence: 0.95,
      severity: 5,
      category: "temperature",
    },
    {
      id: "2",
      type: "warning",
      title: "Humidity Level Rising",
      description: "Humidity above normal range",
      sensorId: "hum-1",
      sensorName: "Kitchen Humidity",
      location: "Kitchen",
      detectedAt: new Date().toISOString(),
      value: 75,
      expectedValue: 55,
      unit: "%",
      confidence: 0.82,
      severity: 3,
      category: "humidity",
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: "John Doe",
    },
  ]

  const mockProps = {
    alerts: mockAlerts,
    onAcknowledge: jest.fn(),
    onResolve: jest.fn(),
    onDismiss: jest.fn(),
    notificationsEnabled: true,
    onToggleNotifications: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders anomaly alerts with active count", () => {
    render(<AnomalyAlerts {...mockProps} />)
    expect(screen.getByText("Active Alerts")).toBeTruthy()
  })

  it("displays critical alert count", () => {
    render(<AnomalyAlerts {...mockProps} />)
    expect(screen.getByText("Critical")).toBeTruthy()
    expect(screen.getByText("1")).toBeTruthy()
  })

  it("shows warning alert count", () => {
    render(<AnomalyAlerts {...mockProps} />)
    expect(screen.getByText("Warnings")).toBeTruthy()
  })

  it("displays notification toggle", () => {
    render(<AnomalyAlerts {...mockProps} />)
    expect(screen.getByText("Notifications")).toBeTruthy()
  })

  it("calls onToggleNotifications when switch is toggled", () => {
    render(<AnomalyAlerts {...mockProps} />)
    const notificationSwitch = screen.getByRole("switch", { name: /notifications/i })
    fireEvent.click(notificationSwitch)
    expect(mockProps.onToggleNotifications).toHaveBeenCalled()
  })

  it("renders all alert items", () => {
    render(<AnomalyAlerts {...mockProps} />)
    expect(screen.getByText("Temperature Spike Detected")).toBeTruthy()
    expect(screen.getByText("Humidity Level Rising")).toBeTruthy()
  })

  it("shows acknowledge button for unacknowledged alerts", () => {
    render(<AnomalyAlerts {...mockProps} />)
    const acknowledgeButtons = screen.getAllByText("Acknowledge")
    expect(acknowledgeButtons.length).toBeGreaterThan(0)
  })

  it("calls onAcknowledge when acknowledge button clicked", () => {
    render(<AnomalyAlerts {...mockProps} />)
    const acknowledgeButton = screen.getAllByText("Acknowledge")[0]
    fireEvent.click(acknowledgeButton)
    expect(mockProps.onAcknowledge).toHaveBeenCalledWith("1")
  })

  it("displays confidence percentage", () => {
    render(<AnomalyAlerts {...mockProps} />)
    expect(screen.getByText(/95%/)).toBeTruthy()
  })

  it("switches between alerts and analytics tabs", () => {
    render(<AnomalyAlerts {...mockProps} />)
    const analyticsTab = screen.getByText("Analytics")
    fireEvent.click(analyticsTab)
    expect(screen.getByText(/total alerts/i)).toBeTruthy()
  })
})
