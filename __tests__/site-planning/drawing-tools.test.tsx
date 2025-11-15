import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { DrawingTools } from "@/components/site-planning/drawing-tools"

describe("DrawingTools", () => {
  const mockProps = {
    activeTool: 'select' as const,
    onToolChange: jest.fn(),
  }

  it("renders drawing tools panel", () => {
    render(<DrawingTools {...mockProps} />)
    expect(screen.getByText("Drawing Tools")).toBeTruthy()
  })

  it("displays all tool buttons", () => {
    render(<DrawingTools {...mockProps} />)
    expect(screen.getByText("Select")).toBeTruthy()
    expect(screen.getByText("Rectangle")).toBeTruthy()
    expect(screen.getByText("Circle")).toBeTruthy()
    expect(screen.getByText("Line")).toBeTruthy()
  })

  it("highlights active tool", () => {
    const { container } = render(<DrawingTools {...mockProps} activeTool="rectangle" />)
    const rectangleButton = screen.getByText("Rectangle").closest('button')
    expect(rectangleButton?.className).toContain('bg-')
  })

  it("calls onToolChange when tool is selected", () => {
    const onToolChange = jest.fn()
    render(<DrawingTools {...mockProps} onToolChange={onToolChange} />)

    const circleButton = screen.getByText("Circle")
    fireEvent.click(circleButton)
    expect(onToolChange).toHaveBeenCalledWith('circle')
  })

  it("shows view controls section", () => {
    render(<DrawingTools {...mockProps} />)
    expect(screen.getByText("View Controls")).toBeTruthy()
  })

  it("renders zoom in and zoom out buttons", () => {
    render(<DrawingTools {...mockProps} />)
    expect(screen.getByText("Zoom In")).toBeTruthy()
    expect(screen.getByText("Zoom Out")).toBeTruthy()
  })

  it("displays edit controls", () => {
    render(<DrawingTools {...mockProps} />)
    expect(screen.getByText("Edit Controls")).toBeTruthy()
  })

  it("shows undo and redo buttons", () => {
    const { container } = render(<DrawingTools {...mockProps} />)
    const undoButton = container.querySelector('[title="Undo"]')
    const redoButton = container.querySelector('[title="Redo"]')
    expect(undoButton).toBeTruthy()
    expect(redoButton).toBeTruthy()
  })

  it("disables undo when canUndo is false", () => {
    render(<DrawingTools {...mockProps} canUndo={false} />)
    const undoButton = screen.getByTitle("Undo")
    expect(undoButton).toBeDisabled()
  })

  it("shows style controls section", () => {
    render(<DrawingTools {...mockProps} />)
    expect(screen.getByText("Style Controls")).toBeTruthy()
  })
})
