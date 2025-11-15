import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { GeoJSONViewer } from "@/components/site-planning/geojson-viewer"

const mockData = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      id: 1,
      properties: { name: "Test Feature" },
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
  ],
}

describe("GeoJSONViewer", () => {
  it("renders GeoJSON viewer", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("GeoJSON Viewer")).toBeTruthy()
  })

  it("displays feature count", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText(/1 Features/i)).toBeTruthy()
  })

  it("shows properties count badge", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText(/Properties/i)).toBeTruthy()
  })

  it("renders copy button", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("Copy")).toBeTruthy()
  })

  it("renders download button", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("Download")).toBeTruthy()
  })

  it("shows formatted tab", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("Formatted")).toBeTruthy()
  })

  it("shows raw tab", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("Raw")).toBeTruthy()
  })

  it("displays feature properties", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("Test Feature")).toBeTruthy()
  })

  it("shows geometry type", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText("Point")).toBeTruthy()
  })

  it("displays geometry types in footer", () => {
    render(<GeoJSONViewer data={mockData} />)
    expect(screen.getByText(/Geometry Types:/i)).toBeTruthy()
  })
})
