import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { CategoryFilter } from "@/components/models/category-filter"

describe("CategoryFilter", () => {
  const mockOnCategoriesChange = jest.fn()
  const mockCategories = ["Furniture", "Lighting", "Fixtures", "Appliances"]

  it("renders filter title", () => {
    render(<CategoryFilter />)
    const title = screen.getByText("Category Filter")
    expect(title).toBeTruthy()
  })

  it("renders with default categories", () => {
    render(<CategoryFilter />)
    const furnitureCheckbox = screen.getByLabelText("Furniture")
    expect(furnitureCheckbox).toBeTruthy()
  })

  it("renders with custom categories", () => {
    render(
      <CategoryFilter
        availableCategories={mockCategories}
      />
    )
    const furnitureCheckbox = screen.getByLabelText("Furniture")
    const lightingCheckbox = screen.getByLabelText("Lighting")
    expect(furnitureCheckbox).toBeTruthy()
    expect(lightingCheckbox).toBeTruthy()
  })

  it("calls onCategoriesChange when category is selected", () => {
    render(
      <CategoryFilter
        onCategoriesChange={mockOnCategoriesChange}
      />
    )
    const checkbox = screen.getByLabelText("Furniture")
    fireEvent.click(checkbox)
    expect(mockOnCategoriesChange).toHaveBeenCalled()
  })

  it("displays selected count badge", () => {
    render(
      <CategoryFilter
        selectedCategories={["Furniture", "Lighting"]}
      />
    )
    const badge = screen.getByText("2")
    expect(badge).toBeTruthy()
  })

  it("shows Clear button when categories are selected", () => {
    render(
      <CategoryFilter
        selectedCategories={["Furniture"]}
      />
    )
    const clearButton = screen.getByText("Clear")
    expect(clearButton).toBeTruthy()
  })

  it("shows Select All button when no categories are selected", () => {
    render(
      <CategoryFilter
        selectedCategories={[]}
      />
    )
    const selectAllButton = screen.getByText("Select All")
    expect(selectAllButton).toBeTruthy()
  })

  it("displays category counts when showCount is true", () => {
    const counts = { Furniture: 25, Lighting: 15 }
    render(
      <CategoryFilter
        showCount={true}
        categoryCounts={counts}
        availableCategories={["Furniture", "Lighting"]}
      />
    )
    const furnitureCount = screen.getByText("25")
    const lightingCount = screen.getByText("15")
    expect(furnitureCount).toBeTruthy()
    expect(lightingCount).toBeTruthy()
  })

  it("disables categories with zero count", () => {
    const counts = { Furniture: 0, Lighting: 15 }
    render(
      <CategoryFilter
        showCount={true}
        categoryCounts={counts}
        availableCategories={["Furniture", "Lighting"]}
      />
    )
    const furnitureCheckbox = screen.getByLabelText("Furniture")
    expect(furnitureCheckbox.hasAttribute("disabled") || furnitureCheckbox.getAttribute("aria-disabled") === "true").toBeTruthy()
  })

  it("displays selected categories as pills", () => {
    render(
      <CategoryFilter
        selectedCategories={["Furniture", "Lighting"]}
      />
    )
    const selectedSection = screen.getByText(/Selected \(2\)/)
    expect(selectedSection).toBeTruthy()
  })
})
