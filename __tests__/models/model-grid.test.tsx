import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { ModelGrid, Model } from "@/components/models/model-grid"

const mockModels: Model[] = [
  {
    id: "1",
    name: "Modern Chair",
    thumbnail: "https://example.com/chair.jpg",
    category: "Furniture",
    polygonCount: 15000,
    fileSize: 2048000,
    downloads: 150,
    rating: 4.5,
    author: "Designer A",
    tags: ["modern", "chair"],
  },
  {
    id: "2",
    name: "Pendant Light",
    thumbnail: "https://example.com/light.jpg",
    category: "Lighting",
    polygonCount: 8000,
    fileSize: 1024000,
    downloads: 200,
    rating: 4.8,
    author: "Designer B",
    tags: ["lighting", "pendant"],
  },
]

describe("ModelGrid", () => {
  const mockOnModelSelect = jest.fn()
  const mockOnViewModeChange = jest.fn()

  it("renders loading state", () => {
    render(<ModelGrid models={[]} loading={true} />)
    const loader = screen.getByRole("img", { hidden: true }) || document.querySelector(".animate-spin")
    expect(loader).toBeTruthy()
  })

  it("renders empty state when no models are provided", () => {
    render(<ModelGrid models={[]} />)
    const emptyMessage = screen.getByText("No models found")
    expect(emptyMessage).toBeTruthy()
  })

  it("renders models in grid view by default", () => {
    render(<ModelGrid models={mockModels} />)
    const modelName1 = screen.getByText("Modern Chair")
    const modelName2 = screen.getByText("Pendant Light")
    expect(modelName1).toBeTruthy()
    expect(modelName2).toBeTruthy()
  })

  it("displays correct model count", () => {
    render(<ModelGrid models={mockModels} />)
    const countText = screen.getByText("2 models")
    expect(countText).toBeTruthy()
  })

  it("displays singular 'model' for single item", () => {
    render(<ModelGrid models={[mockModels[0]]} />)
    const countText = screen.getByText("1 model")
    expect(countText).toBeTruthy()
  })

  it("calls onModelSelect when model is clicked", () => {
    render(<ModelGrid models={mockModels} onModelSelect={mockOnModelSelect} />)
    const modelElement = screen.getByText("Modern Chair").closest("div")
    if (modelElement) {
      fireEvent.click(modelElement)
      expect(mockOnModelSelect).toHaveBeenCalledWith(mockModels[0])
    }
  })

  it("switches to list view when list button is clicked", () => {
    render(<ModelGrid models={mockModels} onViewModeChange={mockOnViewModeChange} />)
    const buttons = screen.getAllByRole("button")
    const listButton = buttons.find(btn => btn.querySelector('svg'))

    if (listButton) {
      fireEvent.click(listButton)
      expect(mockOnViewModeChange).toHaveBeenCalled()
    }
  })

  it("highlights selected model", () => {
    render(
      <ModelGrid
        models={mockModels}
        selectedModelId="1"
      />
    )
    const selectedModel = screen.getByText("Modern Chair").closest("div")
    expect(selectedModel?.className).toContain("ring-2")
  })

  it("displays model metadata in grid view", () => {
    render(<ModelGrid models={mockModels} viewMode="grid" />)
    const polygonCount = screen.getByText("15,000 polys")
    const rating = screen.getByText("4.5")
    expect(polygonCount).toBeTruthy()
    expect(rating).toBeTruthy()
  })

  it("displays additional metadata in list view", () => {
    render(<ModelGrid models={mockModels} viewMode="list" />)
    const category = screen.getByText("Furniture")
    const fileSize = screen.getByText(/MB/)
    expect(category).toBeTruthy()
    expect(fileSize).toBeTruthy()
  })
})
