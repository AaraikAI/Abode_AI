import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { StyleFilter, ArchitecturalStyle } from "@/components/models/style-filter"

describe("StyleFilter", () => {
  const mockOnStylesChange = jest.fn()
  const mockOnApply = jest.fn()

  it("renders in popover variant by default", () => {
    render(<StyleFilter />)
    const filterButton = screen.getByText("Style Filter")
    expect(filterButton).toBeTruthy()
  })

  it("renders architectural styles", () => {
    render(<StyleFilter variant="inline" />)
    const modernStyle = screen.getByText("Modern")
    const contemporaryStyle = screen.getByText("Contemporary")
    expect(modernStyle).toBeTruthy()
    expect(contemporaryStyle).toBeTruthy()
  })

  it("displays style descriptions", () => {
    render(<StyleFilter variant="inline" />)
    const modernDesc = screen.getByText(/Clean lines/)
    expect(modernDesc).toBeTruthy()
  })

  it("shows popular badge for popular styles", () => {
    render(<StyleFilter variant="inline" />)
    const popularBadges = screen.getAllByText("Popular")
    expect(popularBadges.length).toBeGreaterThan(0)
  })

  it("calls onStylesChange when style is selected", () => {
    render(
      <StyleFilter
        variant="inline"
        onStylesChange={mockOnStylesChange}
      />
    )
    const modernCheckbox = screen.getByLabelText("Modern")
    fireEvent.click(modernCheckbox)
    expect(mockOnStylesChange).toHaveBeenCalled()
  })

  it("displays selected count badge in popover variant", () => {
    const selectedStyles: ArchitecturalStyle[] = ["modern", "contemporary"]
    render(
      <StyleFilter
        selectedStyles={selectedStyles}
        variant="popover"
      />
    )
    const badge = screen.getByText("2")
    expect(badge).toBeTruthy()
  })

  it("shows Clear all button when styles are selected", () => {
    render(
      <StyleFilter
        variant="inline"
        selectedStyles={["modern"]}
      />
    )
    const clearButton = screen.getByText("Clear all")
    expect(clearButton).toBeTruthy()
  })

  it("enforces maxSelections limit", () => {
    render(
      <StyleFilter
        variant="inline"
        maxSelections={2}
        selectedStyles={["modern", "contemporary"]}
      />
    )
    const selectionText = screen.getByText(/Selected 2 of 2 maximum/)
    expect(selectionText).toBeTruthy()
  })

  it("displays selected styles as pills", () => {
    const selectedStyles: ArchitecturalStyle[] = ["modern"]
    render(
      <StyleFilter
        selectedStyles={selectedStyles}
        variant="popover"
      />
    )
    const stylePill = screen.getByText("Modern")
    expect(stylePill).toBeTruthy()
  })

  it("allows filtering to show only popular styles", () => {
    render(<StyleFilter variant="inline" showPopularOnly={true} />)
    // Should show popular styles like Modern, Contemporary
    const modern = screen.getByText("Modern")
    expect(modern).toBeTruthy()

    // Should not show non-popular styles like Victorian
    const victorian = screen.queryByText("Victorian")
    expect(victorian).toBeFalsy()
  })
})
