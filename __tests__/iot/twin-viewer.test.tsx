import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TwinViewer, SensorOverlay, TwinLayer } from "@/components/iot/twin-viewer"

describe("TwinViewer", () => {
  const mockSensors: SensorOverlay[] = [
    {
      id: "1",
      sensorId: "temp-1",
      name: "Temperature Sensor 1",
      type: "temperature",
      position: { x: 10, y: 20, z: 5 },
      value: 22.5,
      unit: "°C",
      status: "normal",
      visible: true,
    },
    {
      id: "2",
      sensorId: "hum-1",
      name: "Humidity Sensor 1",
      type: "humidity",
      position: { x: 15, y: 25, z: 5 },
      value: 65,
      unit: "%",
      status: "warning",
      visible: true,
    },
  ]

  const mockLayers: TwinLayer[] = [
    {
      id: "1",
      name: "Structure",
      type: "structure",
      visible: true,
      opacity: 1,
    },
    {
      id: "2",
      name: "HVAC System",
      type: "hvac",
      visible: false,
      opacity: 0.8,
    },
  ]

  const mockProps = {
    modelId: "building-model-1",
    sensors: mockSensors,
    layers: mockLayers,
    onSensorClick: jest.fn(),
    onLayerToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders digital twin viewer with title", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("Digital Twin Viewer")).toBeTruthy()
  })

  it("displays model ID", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText(/building-model-1/)).toBeTruthy()
  })

  it("shows reset view button", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("Reset View")).toBeTruthy()
  })

  it("renders view settings panel", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("View Settings")).toBeTruthy()
  })

  it("displays grid toggle switch", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("Show Grid")).toBeTruthy()
  })

  it("shows layers panel with layer count", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("Layers")).toBeTruthy()
  })

  it("renders all layer items", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("Structure")).toBeTruthy()
    expect(screen.getByText("HVAC System")).toBeTruthy()
  })

  it("displays sensors panel with sensor count", () => {
    render(<TwinViewer {...mockProps} />)
    expect(screen.getByText("Sensors")).toBeTruthy()
  })

  it("calls onSensorClick when sensor is clicked", () => {
    render(<TwinViewer {...mockProps} />)
    const sensor = screen.getByText("Temperature Sensor 1")
    fireEvent.click(sensor)
    expect(mockProps.onSensorClick).toHaveBeenCalled()
  })

  it("shows selected sensor details", () => {
    render(<TwinViewer {...mockProps} />)
    const sensor = screen.getByText("Temperature Sensor 1")
    fireEvent.click(sensor)
    expect(screen.getByText("Selected Sensor Details")).toBeTruthy()
  })
})
