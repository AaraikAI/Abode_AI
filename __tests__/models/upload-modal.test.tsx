import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { UploadModal } from "@/components/models/upload-modal"

describe("UploadModal", () => {
  const mockOnOpenChange = jest.fn()
  const mockOnUpload = jest.fn()

  it("renders when open prop is true", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const title = screen.getByText("Upload 3D Model")
    expect(title).toBeTruthy()
  })

  it("does not render when open prop is false", () => {
    render(<UploadModal open={false} onOpenChange={mockOnOpenChange} />)
    const title = screen.queryByText("Upload 3D Model")
    expect(title).toBeFalsy()
  })

  it("displays supported file formats in description", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const description = screen.getByText(/Supported formats/)
    expect(description).toBeTruthy()
  })

  it("shows file upload drop zone", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const dropZone = screen.getByText(/Drop your 3D model here/)
    expect(dropZone).toBeTruthy()
  })

  it("displays model name input field", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const nameInput = screen.getByLabelText(/Model Name/)
    expect(nameInput).toBeTruthy()
  })

  it("displays category selector", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const categoryLabel = screen.getByText(/Category/)
    expect(categoryLabel).toBeTruthy()
  })

  it("shows description textarea", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const descriptionTextarea = screen.getByLabelText(/Description/)
    expect(descriptionTextarea).toBeTruthy()
  })

  it("displays tags input field", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const tagsInput = screen.getByLabelText(/Tags/)
    expect(tagsInput).toBeTruthy()
  })

  it("shows upload button in disabled state initially", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const uploadButtons = screen.getAllByRole("button")
    const uploadButton = uploadButtons.find(btn => btn.textContent?.includes("Upload Model"))
    expect(uploadButton?.hasAttribute("disabled")).toBeTruthy()
  })

  it("displays cancel button", () => {
    render(<UploadModal open={true} onOpenChange={mockOnOpenChange} />)
    const cancelButton = screen.getByText("Cancel")
    expect(cancelButton).toBeTruthy()
  })
})
