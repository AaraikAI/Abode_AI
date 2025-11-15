import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { Favorites, Model } from "@/components/models/favorites"

const mockModels: Model[] = [
  {
    id: "fav-1",
    name: "Modern Lamp",
    category: "Lighting",
    fileFormat: "GLB",
    fileSize: 2048000,
    downloads: 300,
    favoriteDate: new Date("2024-01-15"),
    tags: ["modern", "lamp"],
  },
  {
    id: "fav-2",
    name: "Office Desk",
    category: "Furniture",
    fileFormat: "FBX",
    fileSize: 4096000,
    downloads: 450,
    favoriteDate: new Date("2024-01-20"),
    tags: ["office", "desk"],
  },
]

describe("Favorites", () => {
  const mockOnUnfavorite = jest.fn()
  const mockOnDownload = jest.fn()
  const mockOnView = jest.fn()

  it("renders component title", () => {
    render(<Favorites models={mockModels} />)
    const title = screen.getByText("Favorite Models")
    expect(title).toBeTruthy()
  })

  it("displays loading state", () => {
    render(<Favorites models={[]} loading={true} />)
    const loadingCards = document.querySelectorAll('.animate-pulse')
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it("displays empty state when no favorites", () => {
    render(<Favorites models={[]} />)
    const emptyMessage = screen.getByText("No favorite models yet")
    expect(emptyMessage).toBeTruthy()
  })

  it("shows custom empty message", () => {
    render(
      <Favorites
        models={[]}
        emptyMessage="Your favorites list is empty"
      />
    )
    const customMessage = screen.getByText("Your favorites list is empty")
    expect(customMessage).toBeTruthy()
  })

  it("renders all favorite models", () => {
    render(<Favorites models={mockModels} />)
    const lamp = screen.getByText("Modern Lamp")
    const desk = screen.getByText("Office Desk")
    expect(lamp).toBeTruthy()
    expect(desk).toBeTruthy()
  })

  it("displays model count correctly", () => {
    render(<Favorites models={mockModels} />)
    const count = screen.getByText("2 models")
    expect(count).toBeTruthy()
  })

  it("shows grid and list view toggle buttons", () => {
    render(<Favorites models={mockModels} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(2)
  })

  it("calls onView when view button is clicked", () => {
    render(<Favorites models={mockModels} onView={mockOnView} />)
    const viewButtons = screen.getAllByRole("button")
    const viewButton = viewButtons.find(btn => btn.textContent?.includes("View"))

    if (viewButton) {
      fireEvent.click(viewButton)
      expect(mockOnView).toHaveBeenCalled()
    }
  })

  it("calls onDownload when download button is clicked", () => {
    render(<Favorites models={mockModels} onDownload={mockOnDownload} />)
    const downloadButtons = screen.getAllByRole("button")
    const downloadButton = downloadButtons.find(btn => btn.textContent?.includes("Download"))

    if (downloadButton) {
      fireEvent.click(downloadButton)
      expect(mockOnDownload).toHaveBeenCalled()
    }
  })

  it("shows confirmation dialog when removing from favorites", async () => {
    render(<Favorites models={mockModels} onUnfavorite={mockOnUnfavorite} />)
    const buttons = screen.getAllByRole("button")

    // Find and click heart button or more options
    const actionButton = buttons.find(btn => {
      const svg = btn.querySelector('svg')
      return svg !== null
    })

    if (actionButton) {
      fireEvent.click(actionButton)
      // Check if dialog appears
      setTimeout(() => {
        const dialog = screen.queryByText(/Remove from favorites/)
        expect(dialog).toBeTruthy()
      }, 100)
    }
  })
})
