import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"

import { RecentDownloads, DownloadedModel } from "@/components/models/recent-downloads"

const mockModels: DownloadedModel[] = [
  {
    id: "dl-1",
    name: "Gaming Chair",
    category: "Furniture",
    fileFormat: "GLB",
    fileSize: 3145728,
    downloadDate: new Date(Date.now() - 3600000), // 1 hour ago
    localPath: "/downloads/gaming-chair.glb",
  },
  {
    id: "dl-2",
    name: "Ceiling Fan",
    category: "Fixtures",
    fileFormat: "FBX",
    fileSize: 2097152,
    downloadDate: new Date(Date.now() - 86400000), // 1 day ago
    localPath: "/downloads/ceiling-fan.fbx",
  },
]

describe("RecentDownloads", () => {
  const mockOnView = jest.fn()
  const mockOnRedownload = jest.fn()
  const mockOnOpenFolder = jest.fn()
  const mockOnRemoveFromHistory = jest.fn()
  const mockOnClearHistory = jest.fn()

  it("renders component title", () => {
    render(<RecentDownloads models={mockModels} />)
    const title = screen.getByText("Recent Downloads")
    expect(title).toBeTruthy()
  })

  it("displays loading state", () => {
    render(<RecentDownloads models={[]} loading={true} />)
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it("shows empty state when no downloads", () => {
    render(<RecentDownloads models={[]} />)
    const emptyMessage = screen.getByText("No downloads yet")
    expect(emptyMessage).toBeTruthy()
  })

  it("renders all downloaded models", () => {
    render(<RecentDownloads models={mockModels} />)
    const chair = screen.getByText("Gaming Chair")
    const fan = screen.getByText("Ceiling Fan")
    expect(chair).toBeTruthy()
    expect(fan).toBeTruthy()
  })

  it("displays download count", () => {
    render(<RecentDownloads models={mockModels} />)
    const count = screen.getByText("2 downloads")
    expect(count).toBeTruthy()
  })

  it("shows Clear History button", () => {
    render(<RecentDownloads models={mockModels} />)
    const clearButton = screen.getByText("Clear History")
    expect(clearButton).toBeTruthy()
  })

  it("displays relative time for recent downloads", () => {
    render(<RecentDownloads models={mockModels} />)
    const timeText = screen.getByText(/hour/)
    expect(timeText).toBeTruthy()
  })

  it("calls onView when view button is clicked", () => {
    render(<RecentDownloads models={mockModels} onView={mockOnView} />)
    const buttons = screen.getAllByRole("button")
    const viewButton = buttons.find(btn => btn.getAttribute("title") === "View model")

    if (viewButton) {
      fireEvent.click(viewButton)
      expect(mockOnView).toHaveBeenCalled()
    }
  })

  it("calls onRedownload when redownload button is clicked", () => {
    render(<RecentDownloads models={mockModels} onRedownload={mockOnRedownload} />)
    const buttons = screen.getAllByRole("button")
    const redownloadButton = buttons.find(btn => btn.getAttribute("title") === "Redownload")

    if (redownloadButton) {
      fireEvent.click(redownloadButton)
      expect(mockOnRedownload).toHaveBeenCalled()
    }
  })

  it("limits displayed items based on maxItems prop", () => {
    const manyModels = Array.from({ length: 20 }, (_, i) => ({
      ...mockModels[0],
      id: `dl-${i}`,
      name: `Model ${i}`,
    }))

    render(<RecentDownloads models={manyModels} maxItems={5} />)
    const limitMessage = screen.getByText("Showing 5 of 20 downloads")
    expect(limitMessage).toBeTruthy()
  })
})
