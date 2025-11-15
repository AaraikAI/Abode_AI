import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TraceViewer } from "../trace-viewer"

describe("TraceViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders trace viewer", () => {
    render(<TraceViewer />)
    expect(screen.getByText("Traces")).toBeTruthy()
  })

  it("displays total traces count", () => {
    render(<TraceViewer />)
    expect(screen.getByText("Total Traces")).toBeTruthy()
  })

  it("shows average duration", () => {
    render(<TraceViewer />)
    expect(screen.getByText("Avg Duration")).toBeTruthy()
  })

  it("displays error rate", () => {
    render(<TraceViewer />)
    expect(screen.getByText("Error Rate")).toBeTruthy()
  })

  it("shows services count", () => {
    render(<TraceViewer />)
    expect(screen.getByText("Services")).toBeTruthy()
  })

  it("has search input", () => {
    render(<TraceViewer />)
    const search = screen.getByPlaceholderText(/Search traces/)
    expect(search).toBeTruthy()
  })

  it("renders trace list", () => {
    render(<TraceViewer />)
    expect(screen.getByText(/POST/)).toBeTruthy()
  })

  it("displays span information", () => {
    render(<TraceViewer />)
    const traces = screen.getAllByText(/\d+ms/)
    expect(traces.length).toBeGreaterThan(0)
  })

  it("shows trace ID", () => {
    render(<TraceViewer />)
    expect(screen.getByText(/Trace ID/)).toBeTruthy() ||
    expect(screen.getByText(/trace-/)).toBeTruthy()
  })

  it("displays span waterfall", () => {
    render(<TraceViewer />)
    expect(screen.getByText("No Trace Selected") || screen.getByText(/Span Waterfall/)).toBeTruthy()
  })
})
