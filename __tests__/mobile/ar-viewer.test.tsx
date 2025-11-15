import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ARViewer, ARModel, ARPlacement } from "@/components/mobile/ar-viewer"

describe("ARViewer", () => {
  const mockModel: ARModel = {
    id: "model-1",
    name: "Modern House",
    url: "https://example.com/model.gltf",
    type: "gltf",
    thumbnail: "https://example.com/thumb.jpg",
    metadata: {
      polygons: 50000,
      textures: 5
    }
  }

  const mockPlacement: ARPlacement = {
    position: { x: 0, y: 0, z: -5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }

  const mockOnPlacementChange = jest.fn()
  const mockOnCapture = jest.fn()
  const mockOnShare = jest.fn()

  const defaultProps = {
    model: mockModel,
    initialPlacement: mockPlacement,
    onPlacementChange: mockOnPlacementChange,
    onCapture: mockOnCapture,
    onShare: mockOnShare
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders AR viewer with model name", () => {
    render(<ARViewer {...defaultProps} />)
    expect(screen.getByText("Modern House")).toBeTruthy()
  })

  it("displays preview mode badge when AR is not active", () => {
    render(<ARViewer {...defaultProps} />)
    expect(screen.getByText("Preview Mode")).toBeTruthy()
  })

  it("shows no model loaded message when no model provided", () => {
    render(<ARViewer {...defaultProps} model={undefined} />)
    expect(screen.getByText("No model loaded")).toBeTruthy()
  })

  it("renders all control tabs", () => {
    render(<ARViewer {...defaultProps} />)
    expect(screen.getByText("Controls")).toBeTruthy()
    expect(screen.getByText("Settings")).toBeTruthy()
    expect(screen.getByText("Info")).toBeTruthy()
  })

  it("displays position controls in controls tab", () => {
    render(<ARViewer {...defaultProps} />)
    const controlsTab = screen.getByText("Controls")
    fireEvent.click(controlsTab)
    expect(screen.getByText("Position")).toBeTruthy()
  })

  it("shows rotation controls when rotation mode selected", () => {
    render(<ARViewer {...defaultProps} />)
    const rotationButton = screen.getByText("Rotation")
    fireEvent.click(rotationButton)
    expect(screen.getByText(/X Rotation/)).toBeTruthy()
    expect(screen.getByText(/Y Rotation/)).toBeTruthy()
  })

  it("displays scale controls when scale mode selected", () => {
    render(<ARViewer {...defaultProps} />)
    const scaleButton = screen.getByText("Scale")
    fireEvent.click(scaleButton)
    expect(screen.getByText(/Uniform Scale/)).toBeTruthy()
  })

  it("shows settings options in settings tab", () => {
    render(<ARViewer {...defaultProps} />)
    const settingsTab = screen.getByText("Settings")
    fireEvent.click(settingsTab)
    expect(screen.getByText("Show Grid")).toBeTruthy()
    expect(screen.getByText("Show Shadows")).toBeTruthy()
  })

  it("displays model information in info tab", () => {
    render(<ARViewer {...defaultProps} />)
    const infoTab = screen.getByText("Info")
    fireEvent.click(infoTab)
    expect(screen.getByText("Model Information")).toBeTruthy()
    expect(screen.getByText("GLTF")).toBeTruthy()
  })

  it("shows AR control buttons when model is loaded", () => {
    render(<ARViewer {...defaultProps} />)
    expect(screen.getByText("Start AR")).toBeTruthy()
  })
})
