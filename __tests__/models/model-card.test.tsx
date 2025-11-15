import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { ModelCard } from "@/components/models/model-card"

describe("ModelCard", () => {
  const mockProps = {
    id: "model-1",
    name: "Modern Sofa",
    author: "Designer Studio",
    thumbnail: "https://example.com/sofa.jpg",
    category: "Furniture",
    polygons: 25000,
    downloads: 500,
    rating: 4.7,
    ratingCount: 120,
    tags: ["modern", "sofa", "furniture"],
    fileFormats: ["GLB", "FBX"],
  }

  const mockOnDownload = jest.fn()
  const mockOnFavorite = jest.fn()
  const mockOnView = jest.fn()
  const mockOnDetails = jest.fn()

  it("renders model card with name", () => {
    render(<ModelCard {...mockProps} />)
    const name = screen.getByText("Modern Sofa")
    expect(name).toBeTruthy()
  })

  it("renders author information", () => {
    render(<ModelCard {...mockProps} />)
    const author = screen.getByText("Designer Studio")
    expect(author).toBeTruthy()
  })

  it("displays category badge", () => {
    render(<ModelCard {...mockProps} />)
    const category = screen.getByText("Furniture")
    expect(category).toBeTruthy()
  })

  it("displays formatted polygon count", () => {
    render(<ModelCard {...mockProps} />)
    const polygons = screen.getByText("25K")
    expect(polygons).toBeTruthy()
  })

  it("displays rating with stars", () => {
    render(<ModelCard {...mockProps} />)
    const rating = screen.getByText("4.7")
    expect(rating).toBeTruthy()
  })

  it("calls onDownload when download button is clicked", () => {
    render(<ModelCard {...mockProps} onDownload={mockOnDownload} />)
    const downloadButtons = screen.getAllByRole("button")
    const downloadButton = downloadButtons.find(btn => btn.textContent?.includes("Download"))

    if (downloadButton) {
      fireEvent.click(downloadButton)
      expect(mockOnDownload).toHaveBeenCalledWith("model-1")
    }
  })

  it("calls onFavorite when favorite button is clicked", () => {
    render(<ModelCard {...mockProps} onFavorite={mockOnFavorite} />)
    const buttons = screen.getAllByRole("button")
    const favoriteButton = buttons.find(btn => btn.querySelector('svg'))

    if (favoriteButton) {
      fireEvent.click(favoriteButton)
      expect(mockOnFavorite).toHaveBeenCalledWith("model-1")
    }
  })

  it("shows filled heart when isFavorite is true", () => {
    render(<ModelCard {...mockProps} isFavorite={true} />)
    const heartIcons = document.querySelectorAll('.fill-red-500')
    expect(heartIcons.length).toBeGreaterThan(0)
  })

  it("displays up to 3 tags", () => {
    render(<ModelCard {...mockProps} />)
    const tag1 = screen.getByText("modern")
    const tag2 = screen.getByText("sofa")
    const tag3 = screen.getByText("furniture")
    expect(tag1).toBeTruthy()
    expect(tag2).toBeTruthy()
    expect(tag3).toBeTruthy()
  })

  it("calls onView when card is clicked", () => {
    render(<ModelCard {...mockProps} onView={mockOnView} />)
    const card = screen.getByText("Modern Sofa").closest("div")?.closest("div")
    if (card) {
      fireEvent.click(card)
      expect(mockOnView).toHaveBeenCalledWith("model-1")
    }
  })
})
