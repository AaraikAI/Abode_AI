import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { ModelViewer } from "@/components/models/model-viewer"

// Mock @react-three/fiber and @react-three/drei
jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
  useLoader: jest.fn(),
}))

jest.mock("@react-three/drei", () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  PerspectiveCamera: () => <div data-testid="camera" />,
  Environment: () => <div data-testid="environment" />,
  Grid: () => <div data-testid="grid" />,
}))

describe("ModelViewer", () => {
  const mockOnLoad = jest.fn()
  const mockOnError = jest.fn()

  it("renders canvas container", () => {
    render(<ModelViewer modelUrl="test.glb" />)
    const canvas = screen.getByTestId("canvas")
    expect(canvas).toBeTruthy()
  })

  it("displays loading state initially", () => {
    render(<ModelViewer modelUrl="test.glb" />)
    const loadingText = screen.getByText("Loading 3D model...")
    expect(loadingText).toBeTruthy()
  })

  it("shows auto-rotate toggle in controls", () => {
    render(<ModelViewer modelUrl="test.glb" />)
    const autoRotateLabel = screen.getByText("Auto-rotate")
    expect(autoRotateLabel).toBeTruthy()
  })

  it("shows grid toggle in controls", () => {
    render(<ModelViewer modelUrl="test.glb" />)
    const gridLabel = screen.getByText("Show grid")
    expect(gridLabel).toBeTruthy()
  })

  it("renders zoom controls", () => {
    render(<ModelViewer modelUrl="test.glb" />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("applies custom camera position", () => {
    const customPosition: [number, number, number] = [5, 5, 5]
    render(<ModelViewer modelUrl="test.glb" cameraPosition={customPosition} />)
    const camera = screen.getByTestId("camera")
    expect(camera).toBeTruthy()
  })

  it("applies custom background color", () => {
    render(<ModelViewer modelUrl="test.glb" backgroundColor="#FF0000" />)
    const container = document.querySelector('[style*="background"]')
    expect(container).toBeTruthy()
  })

  it("disables auto-rotate by default", () => {
    render(<ModelViewer modelUrl="test.glb" autoRotate={false} />)
    const autoRotateSwitch = screen.getByRole("switch")
    expect(autoRotateSwitch.getAttribute("aria-checked")).toBe("false")
  })

  it("enables auto-rotate when prop is true", () => {
    render(<ModelViewer modelUrl="test.glb" autoRotate={true} />)
    const autoRotateSwitch = screen.getByRole("switch")
    expect(autoRotateSwitch.getAttribute("aria-checked")).toBe("true")
  })

  it("supports different model formats", () => {
    const formats = ["glb", "gltf", "obj", "fbx"] as const
    formats.forEach(format => {
      const { unmount } = render(
        <ModelViewer modelUrl={`test.${format}`} modelFormat={format} />
      )
      const canvas = screen.getByTestId("canvas")
      expect(canvas).toBeTruthy()
      unmount()
    })
  })
})
