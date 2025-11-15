import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PredictiveMaintenance, MaintenancePrediction, EquipmentHealth, MaintenanceHistory } from "@/components/iot/predictive-maintenance"

describe("PredictiveMaintenance", () => {
  const mockPredictions: MaintenancePrediction[] = [
    {
      id: "1",
      equipmentId: "hvac-1",
      equipmentName: "Main HVAC Unit",
      equipmentType: "hvac",
      location: "Roof",
      issueType: "Compressor Failure",
      severity: "critical",
      probability: 0.85,
      predictedFailureDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      daysUntilFailure: 7,
      recommendedAction: "Replace compressor immediately",
      estimatedCost: 5000,
      estimatedDowntime: 8,
      confidence: 0.92,
      detectedAt: new Date().toISOString(),
      status: "pending",
    },
    {
      id: "2",
      equipmentId: "elev-1",
      equipmentName: "Elevator System",
      equipmentType: "elevator",
      location: "Building Core",
      issueType: "Cable Wear",
      severity: "medium",
      probability: 0.65,
      predictedFailureDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      daysUntilFailure: 30,
      recommendedAction: "Schedule cable inspection and replacement",
      estimatedCost: 2500,
      estimatedDowntime: 4,
      confidence: 0.78,
      detectedAt: new Date().toISOString(),
      status: "scheduled",
      scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      assignedTo: "Maintenance Team A",
    },
  ]

  const mockEquipmentHealth: EquipmentHealth[] = [
    {
      equipmentId: "hvac-1",
      equipmentName: "Main HVAC Unit",
      healthScore: 65,
      lastMaintenance: new Date(Date.now() - 60 * 86400000).toISOString(),
      nextScheduledMaintenance: new Date(Date.now() + 30 * 86400000).toISOString(),
      operatingHours: 15000,
      failureRisk: 0.35,
      trend: "degrading",
    },
  ]

  const mockHistory: MaintenanceHistory[] = [
    {
      date: new Date().toISOString(),
      predictions: 10,
      completed: 8,
      prevented: 5,
      cost: 15000,
    },
  ]

  const mockProps = {
    predictions: mockPredictions,
    equipmentHealth: mockEquipmentHealth,
    history: mockHistory,
    onScheduleMaintenance: jest.fn(),
    onDismissPrediction: jest.fn(),
    onExportReport: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders predictive maintenance dashboard", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    expect(screen.getByText("Active Predictions")).toBeTruthy()
  })

  it("displays prediction count", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    expect(screen.getByText("2")).toBeTruthy()
  })

  it("shows scheduled maintenance count", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    expect(screen.getByText("Scheduled")).toBeTruthy()
  })

  it("displays average cost", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    expect(screen.getByText("Avg Cost per Issue")).toBeTruthy()
  })

  it("renders all prediction items", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    expect(screen.getByText("Main HVAC Unit")).toBeTruthy()
    expect(screen.getByText("Elevator System")).toBeTruthy()
  })

  it("shows schedule button for pending predictions", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    expect(screen.getByText("Schedule Maintenance")).toBeTruthy()
  })

  it("calls onScheduleMaintenance when schedule button clicked", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    const scheduleButton = screen.getByText("Schedule Maintenance")
    fireEvent.click(scheduleButton)
    expect(mockProps.onScheduleMaintenance).toHaveBeenCalledWith("1")
  })

  it("displays equipment health tab", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    const healthTab = screen.getByText("Equipment Health")
    fireEvent.click(healthTab)
    expect(screen.getByText("Equipment Health Monitoring")).toBeTruthy()
  })

  it("shows health score for equipment", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    const healthTab = screen.getByText("Equipment Health")
    fireEvent.click(healthTab)
    expect(screen.getByText("65%")).toBeTruthy()
  })

  it("calls onExportReport when export button clicked", () => {
    render(<PredictiveMaintenance {...mockProps} />)
    const exportButton = screen.getByText("Export")
    fireEvent.click(exportButton)
    expect(mockProps.onExportReport).toHaveBeenCalled()
  })
})
