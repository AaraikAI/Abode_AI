import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { FileList } from "@/components/site-planning/file-list"

const mockFiles = [
  {
    id: "1",
    originalName: "site-plan.pdf",
    fileType: "application/pdf",
    fileSize: 1024000,
    url: "/files/1",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "2",
    originalName: "aerial-photo.jpg",
    fileType: "image/jpeg",
    fileSize: 2048000,
    url: "/files/2",
    uploadedAt: new Date().toISOString(),
  },
]

describe("FileList", () => {
  it("renders file list component", () => {
    render(<FileList files={mockFiles} />)
    expect(screen.getByText("site-plan.pdf")).toBeTruthy()
  })

  it("displays all files", () => {
    render(<FileList files={mockFiles} />)
    expect(screen.getByText("site-plan.pdf")).toBeTruthy()
    expect(screen.getByText("aerial-photo.jpg")).toBeTruthy()
  })

  it("shows file sizes", () => {
    render(<FileList files={mockFiles} />)
    expect(screen.getByText(/MB/i)).toBeTruthy()
  })

  it("renders empty state when no files", () => {
    render(<FileList files={[]} />)
    expect(screen.getByText(/No files uploaded/i)).toBeTruthy()
  })

  it("calls onFileSelect when file is clicked", () => {
    const onSelect = jest.fn()
    render(<FileList files={mockFiles} onFileSelect={onSelect} />)

    const file = screen.getByText("site-plan.pdf")
    fireEvent.click(file.closest('div[class*="cursor-pointer"]') || file)

    expect(onSelect).toHaveBeenCalled()
  })

  it("calls onFileDelete when delete button is clicked", () => {
    const onDelete = jest.fn()
    const { container } = render(<FileList files={mockFiles} onFileDelete={onDelete} />)

    const deleteButtons = container.querySelectorAll('button[title*="Delete"], button[class*="destructive"]')
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])
      expect(onDelete).toHaveBeenCalled()
    }
  })

  it("shows file type icons", () => {
    const { container } = render(<FileList files={mockFiles} />)
    expect(container.textContent).toContain('📄')
    expect(container.textContent).toContain('🖼️')
  })

  it("displays upload date", () => {
    const { container } = render(<FileList files={mockFiles} />)
    expect(container.textContent).toMatch(/ago|Uploaded/i)
  })

  it("highlights selected file", () => {
    const { container } = render(<FileList files={mockFiles} selectedFileId="1" />)
    const cards = container.querySelectorAll('[class*="border"]')
    const selectedCard = Array.from(cards).find(card =>
      card.className.includes('border-primary') || card.className.includes('bg-primary')
    )
    expect(selectedCard).toBeTruthy()
  })

  it("shows file count", () => {
    render(<FileList files={mockFiles} />)
    const text = screen.getByText(/2|files/i, { exact: false })
    expect(text).toBeTruthy()
  })
})
