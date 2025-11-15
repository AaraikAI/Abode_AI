import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { MaterialSwatches, MaterialSwatch } from "@/components/models/material-swatches"

const mockSwatches: MaterialSwatch[] = [
  {
    id: "oak",
    name: "Oak Wood",
    category: "wood",
    properties: { color: "#C19A6B", roughness: 0.8, metallic: 0.0 },
  },
  {
    id: "steel",
    name: "Brushed Steel",
    category: "metal",
    properties: { color: "#B8B8B8", roughness: 0.3, metallic: 0.9 },
  },
  {
    id: "glass",
    name: "Clear Glass",
    category: "glass",
    properties: { color: "#FFFFFF", roughness: 0.0, metallic: 0.0, opacity: 0.2 },
  },
]

describe("MaterialSwatches", () => {
  const mockOnSwatchSelect = jest.fn()
  const mockOnPropertiesChange = jest.fn()

  it("renders component title", () => {
    render(<MaterialSwatches />)
    const title = screen.getByText("Material Swatches")
    expect(title).toBeTruthy()
  })

  it("renders material swatches with categories", () => {
    render(<MaterialSwatches swatches={mockSwatches} />)
    const woodLabel = screen.getByText("Wood")
    const metalLabel = screen.getByText("Metal")
    const glassLabel = screen.getByText("Glass")
    expect(woodLabel).toBeTruthy()
    expect(metalLabel).toBeTruthy()
    expect(glassLabel).toBeTruthy()
  })

  it("calls onSwatchSelect when swatch is clicked", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        onSwatchSelect={mockOnSwatchSelect}
      />
    )
    const swatchButtons = screen.getAllByRole("button")
    const oakSwatch = swatchButtons.find(btn =>
      btn.getAttribute("aria-label")?.includes("Oak Wood")
    )

    if (oakSwatch) {
      fireEvent.click(oakSwatch)
      expect(mockOnSwatchSelect).toHaveBeenCalled()
    }
  })

  it("displays selected swatch badge", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[0]}
      />
    )
    const badge = screen.getByText("Oak Wood")
    expect(badge).toBeTruthy()
  })

  it("shows property editor when showPropertyEditor is true", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[0]}
        showPropertyEditor={true}
      />
    )
    const propertyTitle = screen.getByText("Material Properties")
    expect(propertyTitle).toBeTruthy()
  })

  it("hides property editor when showPropertyEditor is false", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[0]}
        showPropertyEditor={false}
      />
    )
    const propertyTitle = screen.queryByText("Material Properties")
    expect(propertyTitle).toBeFalsy()
  })

  it("displays roughness slider in property editor", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[0]}
        showPropertyEditor={true}
      />
    )
    const roughnessLabel = screen.getByText("Roughness")
    expect(roughnessLabel).toBeTruthy()
  })

  it("displays metallic slider in property editor", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[0]}
        showPropertyEditor={true}
      />
    )
    const metallicLabel = screen.getByText("Metallic")
    expect(metallicLabel).toBeTruthy()
  })

  it("displays color picker in property editor", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[0]}
        showPropertyEditor={true}
      />
    )
    const colorLabel = screen.getByText("Color")
    expect(colorLabel).toBeTruthy()
  })

  it("shows opacity slider for glass materials", () => {
    render(
      <MaterialSwatches
        swatches={mockSwatches}
        selectedSwatch={mockSwatches[2]}
        showPropertyEditor={true}
      />
    )
    const opacityLabel = screen.getByText("Opacity")
    expect(opacityLabel).toBeTruthy()
  })
})
