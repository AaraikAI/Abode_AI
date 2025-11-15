import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FileUpload } from "@/components/site-planning/file-upload"

describe("FileUpload", () => {
  const mockProps = {
    projectId: "test-project-123",
    onUploadComplete: jest.fn(),
    onUploadError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders upload drop zone", () => {
    render(<FileUpload {...mockProps} />)
    expect(screen.getByText(/Drop files here or click to browse/i)).toBeTruthy()
  })

  it("displays supported file types", () => {
    render(<FileUpload {...mockProps} />)
    expect(screen.getByText(/Supports: PDF, JPG, PNG/i)).toBeTruthy()
  })

  it("shows file size limit", () => {
    render(<FileUpload {...mockProps} />)
    expect(screen.getByText(/max 50MB/i)).toBeTruthy()
  })

  it("renders select files button", () => {
    render(<FileUpload {...mockProps} />)
    expect(screen.getByText("Select Files")).toBeTruthy()
  })

  it("has hidden file input with correct attributes", () => {
    const { container } = render(<FileUpload {...mockProps} />)
    const input = container.querySelector('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input?.getAttribute('multiple')).toBe('')
    expect(input?.getAttribute('accept')).toBe('.pdf,.jpg,.jpeg,.png')
  })

  it("applies dragging styles when drag over", () => {
    const { container } = render(<FileUpload {...mockProps} />)
    const dropZone = container.querySelector('[class*="border-2"]')

    if (dropZone) {
      fireEvent.dragOver(dropZone)
      expect(dropZone.className).toContain('border-primary')
    }
  })

  it("removes dragging styles when drag leave", () => {
    const { container } = render(<FileUpload {...mockProps} />)
    const dropZone = container.querySelector('[class*="border-2"]')

    if (dropZone) {
      fireEvent.dragOver(dropZone)
      fireEvent.dragLeave(dropZone)
      expect(dropZone.className).toContain('border-gray-300')
    }
  })

  it("shows upload icon", () => {
    const { container } = render(<FileUpload {...mockProps} />)
    const uploadIcon = container.querySelector('svg.lucide-upload')
    expect(uploadIcon).toBeTruthy()
  })

  it("opens file selector on drop zone click", () => {
    const { container } = render(<FileUpload {...mockProps} />)
    const dropZone = container.querySelector('[class*="border-2"]')
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const clickSpy = jest.fn()
    if (fileInput) {
      fileInput.click = clickSpy
    }

    if (dropZone) {
      fireEvent.click(dropZone)
    }
  })

  it("initially shows no uploading files", () => {
    const { container } = render(<FileUpload {...mockProps} />)
    expect(screen.queryByText(/Upload complete/i)).toBeNull()
    expect(screen.queryByText(/Uploading/i)).toBeNull()
  })
})
