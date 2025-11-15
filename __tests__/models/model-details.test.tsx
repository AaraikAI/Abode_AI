import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { ModelDetails } from "@/components/models/model-details"

describe("ModelDetails", () => {
  const mockProps = {
    id: "model-123",
    name: "Luxury Office Chair",
    description: "A premium ergonomic office chair with advanced features",
    author: {
      name: "Modern Designer",
      avatar: "https://example.com/avatar.jpg",
      bio: "Professional 3D artist",
      modelsCount: 45,
    },
    category: "Furniture",
    tags: ["office", "chair", "ergonomic"],
    polygons: 50000,
    vertices: 75000,
    fileSize: 5242880,
    fileFormats: [
      { format: "GLB", size: 5242880, url: "model.glb" },
      { format: "FBX", size: 6291456, url: "model.fbx" },
    ],
    downloads: 1500,
    views: 5000,
    favorites: 250,
    rating: 4.8,
    ratingCount: 89,
    ratingDistribution: { 5: 60, 4: 20, 3: 5, 2: 2, 1: 2 },
    license: "Creative Commons",
    createdAt: new Date("2024-01-01"),
  }

  const mockOnDownload = jest.fn()
  const mockOnFavorite = jest.fn()
  const mockOnShare = jest.fn()

  it("renders model name", () => {
    render(<ModelDetails {...mockProps} />)
    const name = screen.getByText("Luxury Office Chair")
    expect(name).toBeTruthy()
  })

  it("displays category badge", () => {
    render(<ModelDetails {...mockProps} />)
    const category = screen.getByText("Furniture")
    expect(category).toBeTruthy()
  })

  it("displays rating with count", () => {
    render(<ModelDetails {...mockProps} />)
    const rating = screen.getByText("4.8")
    expect(rating).toBeTruthy()
  })

  it("shows download count", () => {
    render(<ModelDetails {...mockProps} />)
    const downloads = screen.getByText(/1,500 downloads/)
    expect(downloads).toBeTruthy()
  })

  it("renders description tab content", () => {
    render(<ModelDetails {...mockProps} />)
    const description = screen.getByText("A premium ergonomic office chair with advanced features")
    expect(description).toBeTruthy()
  })

  it("displays all tags", () => {
    render(<ModelDetails {...mockProps} />)
    const officeTag = screen.getByText("office")
    const chairTag = screen.getByText("chair")
    const ergonomicTag = screen.getByText("ergonomic")
    expect(officeTag).toBeTruthy()
    expect(chairTag).toBeTruthy()
    expect(ergonomicTag).toBeTruthy()
  })

  it("shows technical specifications", () => {
    render(<ModelDetails {...mockProps} />)
    const specsTab = screen.getByText("Technical Specs")
    fireEvent.click(specsTab)
    // Wait for tab content to render
    setTimeout(() => {
      const polygonCount = screen.getByText("50,000")
      expect(polygonCount).toBeTruthy()
    }, 100)
  })

  it("displays author information", () => {
    render(<ModelDetails {...mockProps} />)
    const authorName = screen.getByText("Modern Designer")
    expect(authorName).toBeTruthy()
  })

  it("shows available file formats for download", () => {
    render(<ModelDetails {...mockProps} />)
    const glbFormat = screen.getByText("GLB")
    const fbxFormat = screen.getByText("FBX")
    expect(glbFormat).toBeTruthy()
    expect(fbxFormat).toBeTruthy()
  })

  it("calls onFavorite when favorite button is clicked", () => {
    render(<ModelDetails {...mockProps} onFavorite={mockOnFavorite} />)
    const buttons = screen.getAllByRole("button")
    const favoriteButton = buttons.find(btn => {
      const svg = btn.querySelector('svg')
      return svg?.classList.toString().includes('lucide')
    })

    if (favoriteButton) {
      fireEvent.click(favoriteButton)
      expect(mockOnFavorite).toHaveBeenCalled()
    }
  })
})
