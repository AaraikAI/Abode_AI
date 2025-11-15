import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ElementTree, BIMElement } from "@/components/bim/element-tree"

describe("ElementTree", () => {
  const mockElements: BIMElement[] = [
    {
      id: "1",
      name: "Building A",
      type: "building",
      visible: true,
      selected: false,
      metadata: { elementCount: 150 },
      children: [
        {
          id: "2",
          name: "Level 1",
          type: "story",
          visible: true,
          selected: false,
          children: [
            {
              id: "3",
              name: "Wall-001",
              type: "element",
              category: "Walls",
              visible: true,
              selected: false,
            },
            {
              id: "4",
              name: "Door-001",
              type: "element",
              category: "Doors",
              visible: true,
              selected: false,
            },
          ],
        },
      ],
    },
  ]

  const mockProps = {
    elements: mockElements,
    selectedIds: [],
    onSelect: jest.fn(),
    onVisibilityToggle: jest.fn(),
    onFocus: jest.fn(),
    showMetadata: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders building elements tree with header", () => {
    render(<ElementTree {...mockProps} />)
    expect(screen.getByText("Building Elements")).toBeTruthy()
  })

  it("displays total element count", () => {
    render(<ElementTree {...mockProps} />)
    expect(screen.getByText(/items/i)).toBeTruthy()
  })

  it("shows search input for filtering elements", () => {
    render(<ElementTree {...mockProps} />)
    const searchInput = screen.getByPlaceholderText(/Search elements/i)
    expect(searchInput).toBeTruthy()
  })

  it("renders filter dropdown button", () => {
    render(<ElementTree {...mockProps} />)
    const filterButtons = screen.getAllByRole('button')
    const filterButton = filterButtons.find(btn => btn.querySelector('.lucide-filter'))
    expect(filterButton).toBeTruthy()
  })

  it("displays hierarchical tree structure with expand/collapse", () => {
    render(<ElementTree {...mockProps} />)
    expect(screen.getByText("Building A")).toBeTruthy()
    expect(screen.getByText("Level 1")).toBeTruthy()
  })

  it("shows element categories as badges", () => {
    render(<ElementTree {...mockProps} />)
    expect(screen.getByText("Walls")).toBeTruthy()
    expect(screen.getByText("Doors")).toBeTruthy()
  })

  it("renders checkboxes for element selection", () => {
    render(<ElementTree {...mockProps} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it("calls onSelect when element checkbox is clicked", () => {
    render(<ElementTree {...mockProps} />)
    const checkboxes = screen.getAllByRole('checkbox')

    if (checkboxes[0]) {
      fireEvent.click(checkboxes[0])
      expect(mockProps.onSelect).toHaveBeenCalled()
    }
  })

  it("displays selected count and clear selection button", () => {
    const propsWithSelection = {
      ...mockProps,
      selectedIds: ["1", "2"],
    }
    render(<ElementTree {...propsWithSelection} />)
    expect(screen.getByText(/2 selected/i)).toBeTruthy()
    expect(screen.getByText(/Clear Selection/i)).toBeTruthy()
  })

  it("filters elements based on search query", () => {
    render(<ElementTree {...mockProps} />)
    const searchInput = screen.getByPlaceholderText(/Search elements/i)

    fireEvent.change(searchInput, { target: { value: 'Wall' } })

    waitFor(() => {
      expect(screen.getByText("Wall-001")).toBeTruthy()
    })
  })
})
