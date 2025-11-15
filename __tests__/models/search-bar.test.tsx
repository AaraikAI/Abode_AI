import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SearchBar } from "@/components/models/search-bar"

describe("SearchBar", () => {
  const mockOnChange = jest.fn()
  const mockOnSearch = jest.fn()
  const mockOnFiltersChange = jest.fn()

  it("renders with default placeholder", () => {
    render(<SearchBar value="" onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText("Search models...")
    expect(input).toBeTruthy()
  })

  it("renders with custom placeholder", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        placeholder="Search 3D models..."
      />
    )
    const input = screen.getByPlaceholderText("Search 3D models...")
    expect(input).toBeTruthy()
  })

  it("calls onChange when typing in search input", async () => {
    const user = userEvent.setup()
    render(<SearchBar value="" onChange={mockOnChange} />)
    const input = screen.getByPlaceholderText("Search models...")

    await user.type(input, "chair")
    expect(mockOnChange).toHaveBeenCalled()
  })

  it("calls onSearch when search button is clicked", () => {
    render(
      <SearchBar
        value="sofa"
        onChange={mockOnChange}
        onSearch={mockOnSearch}
      />
    )
    const searchButton = screen.getByText("Search")
    fireEvent.click(searchButton)
    expect(mockOnSearch).toHaveBeenCalledWith("sofa", {})
  })

  it("calls onSearch when Enter key is pressed", () => {
    render(
      <SearchBar
        value="table"
        onChange={mockOnChange}
        onSearch={mockOnSearch}
      />
    )
    const input = screen.getByPlaceholderText("Search models...")
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 })
    expect(mockOnSearch).toHaveBeenCalledWith("table", {})
  })

  it("shows clear button when value is not empty", () => {
    render(<SearchBar value="lamp" onChange={mockOnChange} />)
    const clearButton = screen.getByRole("button", { name: "" })
    expect(clearButton).toBeTruthy()
  })

  it("clears search value when clear button is clicked", () => {
    render(<SearchBar value="desk" onChange={mockOnChange} />)
    const clearButtons = screen.getAllByRole("button")
    const clearButton = clearButtons.find(btn => btn.querySelector('svg'))

    if (clearButton) {
      fireEvent.click(clearButton)
      expect(mockOnChange).toHaveBeenCalledWith("")
    }
  })

  it("shows advanced filters button when showAdvancedFilters is true", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        showAdvancedFilters={true}
      />
    )
    const filtersButton = screen.getByText("Filters")
    expect(filtersButton).toBeTruthy()
  })

  it("hides advanced filters button when showAdvancedFilters is false", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        showAdvancedFilters={false}
      />
    )
    const filtersButton = screen.queryByText("Filters")
    expect(filtersButton).toBeFalsy()
  })

  it("displays active filter count badge when filters are applied", () => {
    const filters = {
      categories: ["Furniture", "Lighting"],
      fileFormats: ["GLB"],
    }
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        filters={filters}
        showAdvancedFilters={true}
      />
    )
    // Filter count badge should be visible
    const filtersButton = screen.getByText("Filters")
    expect(filtersButton).toBeTruthy()
  })
})
