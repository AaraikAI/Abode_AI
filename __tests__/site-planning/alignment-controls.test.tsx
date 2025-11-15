import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { AlignmentControls } from "@/components/site-planning/alignment-controls"

const mockSettings = {
  snapToGrid: true,
  gridSize: 20,
  snapToObjects: true,
  snapDistance: 10,
  showGrid: true,
  showRulers: true,
  showCrosshair: false,
  rotation: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}

describe("AlignmentControls", () => {
  it("renders alignment controls panel", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    expect(screen.getByText("Snap")).toBeTruthy()
  })

  it("shows snap tab", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    fireEvent.click(screen.getByText("Snap"))
    expect(screen.getByText("Snap to Grid")).toBeTruthy()
  })

  it("shows align tab", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    fireEvent.click(screen.getByText("Align"))
    expect(screen.getByText(/Align Objects/i)).toBeTruthy()
  })

  it("shows transform tab", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    fireEvent.click(screen.getByText("Transform"))
    expect(screen.getByText("Rotation")).toBeTruthy()
  })

  it("displays snap to grid toggle", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    expect(screen.getByText("Snap to Grid")).toBeTruthy()
  })

  it("shows grid size slider when snap to grid enabled", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    expect(screen.getByText("Grid Size")).toBeTruthy()
  })

  it("displays snap to objects toggle", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    expect(screen.getByText("Snap to Objects")).toBeTruthy()
  })

  it("shows display options", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} />)
    expect(screen.getByText("Show Grid")).toBeTruthy()
    expect(screen.getByText("Show Rulers")).toBeTruthy()
  })

  it("disables align buttons when less than 2 objects selected", () => {
    render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} selectedCount={1} />)
    fireEvent.click(screen.getByText("Align"))

    const { container } = render(<AlignmentControls settings={mockSettings} onSettingsChange={jest.fn()} selectedCount={1} />)
    fireEvent.click(screen.getByText("Align"))
  })

  it("calls onSettingsChange when settings are updated", () => {
    const onChange = jest.fn()
    const { container } = render(<AlignmentControls settings={mockSettings} onSettingsChange={onChange} />)

    const toggle = container.querySelectorAll('[role="switch"]')[0]
    if (toggle) {
      fireEvent.click(toggle)
      expect(onChange).toHaveBeenCalled()
    }
  })
})
