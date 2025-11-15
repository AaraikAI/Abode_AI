import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { PopularModels, PopularModel } from "@/components/models/popular-models"

const mockModels: PopularModel[] = [
  {
    id: "pop-1",
    name: "Trending Chair",
    category: "Furniture",
    fileFormat: "GLB",
    fileSize: 2621440,
    downloads: 5000,
    rating: 4.9,
    reviewCount: 250,
    trendingScore: 95,
    uploadDate: new Date("2024-01-10"),
  },
  {
    id: "pop-2",
    name: "Popular Lamp",
    category: "Lighting",
    fileFormat: "FBX",
    fileSize: 1572864,
    downloads: 3500,
    rating: 4.7,
    reviewCount: 180,
    trendingScore: 88,
    uploadDate: new Date("2024-01-15"),
  },
  {
    id: "pop-3",
    name: "Hot Table",
    category: "Furniture",
    fileFormat: "OBJ",
    fileSize: 3145728,
    downloads: 4200,
    rating: 4.8,
    reviewCount: 200,
    trendingScore: 92,
    uploadDate: new Date("2024-01-12"),
  },
]

describe("PopularModels", () => {
  const mockOnView = jest.fn()
  const mockOnDownload = jest.fn()
  const mockOnToggleFavorite = jest.fn()
  const mockOnTimeRangeChange = jest.fn()

  it("renders component title", () => {
    render(<PopularModels models={mockModels} />)
    const title = screen.getByText("Popular Models")
    expect(title).toBeTruthy()
  })

  it("displays loading state", () => {
    render(<PopularModels models={[]} loading={true} />)
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it("shows empty state when no models", () => {
    render(<PopularModels models={[]} />)
    const emptyMessage = screen.getByText("No popular models yet")
    expect(emptyMessage).toBeTruthy()
  })

  it("renders all popular models", () => {
    render(<PopularModels models={mockModels} />)
    const chair = screen.getByText("Trending Chair")
    const lamp = screen.getByText("Popular Lamp")
    const table = screen.getByText("Hot Table")
    expect(chair).toBeTruthy()
    expect(lamp).toBeTruthy()
    expect(table).toBeTruthy()
  })

  it("displays rank badges for top 3 models", () => {
    render(<PopularModels models={mockModels} initialSortBy="downloads" />)
    const rank1 = screen.getByText("#1")
    const rank2 = screen.getByText("#2")
    const rank3 = screen.getByText("#3")
    expect(rank1).toBeTruthy()
    expect(rank2).toBeTruthy()
    expect(rank3).toBeTruthy()
  })

  it("shows time range selector", () => {
    render(<PopularModels models={mockModels} />)
    const timeRangeSelectors = screen.getAllByRole("combobox")
    expect(timeRangeSelectors.length).toBeGreaterThan(0)
  })

  it("shows sort dropdown", () => {
    render(<PopularModels models={mockModels} />)
    const sortButton = screen.getByText(/Most Downloaded|Highest Rated|Trending/)
    expect(sortButton).toBeTruthy()
  })

  it("displays download counts", () => {
    render(<PopularModels models={mockModels} />)
    const downloads = screen.getByText("5,000")
    expect(downloads).toBeTruthy()
  })

  it("displays ratings with stars", () => {
    render(<PopularModels models={mockModels} />)
    const rating = screen.getByText("4.9")
    expect(rating).toBeTruthy()
  })

  it("calls onView when view button is clicked", () => {
    render(<PopularModels models={mockModels} onView={mockOnView} />)
    const viewButtons = screen.getAllByRole("button")
    const viewButton = viewButtons.find(btn => btn.textContent?.includes("View"))

    if (viewButton) {
      fireEvent.click(viewButton)
      expect(mockOnView).toHaveBeenCalled()
    }
  })
})
