import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { ImageryOverlay } from "@/components/site-planning/imagery-overlay"

const mockLayers = [
  {
    id: "layer-1",
    name: "Satellite View",
    url: "https://example.com/satellite",
    type: "satellite" as const,
    visible: true,
    opacity: 1,
  },
]

describe("ImageryOverlay", () => {
  it("renders imagery overlay panel", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("Imagery Overlay")).toBeTruthy()
  })

  it("displays add layer button", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("Add Layer")).toBeTruthy()
  })

  it("shows base map selection", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("Base Map")).toBeTruthy()
  })

  it("renders layer list", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("Satellite View")).toBeTruthy()
  })

  it("displays layer type", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("satellite")).toBeTruthy()
  })

  it("shows visibility toggle for layers", () => {
    const { container } = render(<ImageryOverlay layers={mockLayers} />)
    const toggle = container.querySelector('[role="switch"]')
    expect(toggle).toBeTruthy()
  })

  it("displays opacity slider", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("Opacity")).toBeTruthy()
  })

  it("shows empty state when no layers", () => {
    render(<ImageryOverlay layers={[]} />)
    expect(screen.getByText(/No overlay layers/i)).toBeTruthy()
  })

  it("calls onLayerToggle when visibility is changed", () => {
    const onToggle = jest.fn()
    const { container } = render(
      <ImageryOverlay layers={mockLayers} onLayerToggle={onToggle} />
    )

    const toggle = container.querySelector('[role="switch"]')
    if (toggle) {
      fireEvent.click(toggle)
      expect(onToggle).toHaveBeenCalled()
    }
  })

  it("displays layer details section", () => {
    render(<ImageryOverlay layers={mockLayers} />)
    expect(screen.getByText("Layer Details")).toBeTruthy()
  })
})
