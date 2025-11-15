import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { FeatureProperties } from "@/components/site-planning/feature-properties"

const mockFeature = {
  id: "feature-1",
  type: "Polygon" as const,
  properties: {
    name: "Building A",
    area: 1500,
    type: "residential",
  },
  geometry: {
    type: "Polygon",
    coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]],
  },
}

describe("FeatureProperties", () => {
  it("renders empty state when no feature selected", () => {
    render(<FeatureProperties feature={null} />)
    expect(screen.getByText(/No feature selected/i)).toBeTruthy()
  })

  it("displays feature ID", () => {
    render(<FeatureProperties feature={mockFeature} />)
    expect(screen.getByText(/feature-1/i)).toBeTruthy()
  })

  it("shows feature geometry type", () => {
    render(<FeatureProperties feature={mockFeature} />)
    expect(screen.getByText(/Polygon/i)).toBeTruthy()
  })

  it("displays feature properties", () => {
    render(<FeatureProperties feature={mockFeature} />)
    expect(screen.getByText("name")).toBeTruthy()
    expect(screen.getByDisplayValue("Building A")).toBeTruthy()
  })

  it("shows all property values", () => {
    render(<FeatureProperties feature={mockFeature} />)
    expect(screen.getByDisplayValue("1500")).toBeTruthy()
    expect(screen.getByDisplayValue("residential")).toBeTruthy()
  })

  it("allows editing properties when not read-only", () => {
    const onUpdate = jest.fn()
    render(<FeatureProperties feature={mockFeature} onUpdateFeature={onUpdate} readOnly={false} />)

    const input = screen.getByDisplayValue("Building A")
    fireEvent.change(input, { target: { value: "Building B" } })

    expect(onUpdate).toHaveBeenCalled()
  })

  it("disables editing in read-only mode", () => {
    render(<FeatureProperties feature={mockFeature} readOnly={true} />)
    const input = screen.getByDisplayValue("Building A")
    expect(input).toBeDisabled()
  })

  it("shows delete feature button when not read-only", () => {
    render(<FeatureProperties feature={mockFeature} readOnly={false} />)
    expect(screen.getByText("Delete")).toBeTruthy()
  })

  it("hides delete button in read-only mode", () => {
    render(<FeatureProperties feature={mockFeature} readOnly={true} />)
    expect(screen.queryByText("Delete")).toBeNull()
  })

  it("shows add property section when not read-only", () => {
    render(<FeatureProperties feature={mockFeature} readOnly={false} />)
    expect(screen.getByText(/Add Property/i)).toBeTruthy()
  })
})
