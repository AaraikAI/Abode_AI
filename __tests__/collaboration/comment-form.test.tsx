import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CommentForm, User, Attachment } from "@/components/collaboration/comment-form"

describe("CommentForm", () => {
  const mockUsers: User[] = [
    { id: "1", name: "John Doe", avatar: "/avatar1.jpg" },
    { id: "2", name: "Jane Smith", avatar: "/avatar2.jpg" },
  ]

  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    users: mockUsers,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders comment form with placeholder", () => {
    render(<CommentForm {...defaultProps} />)
    expect(screen.getByPlaceholderText(/Write a comment/i)).toBeTruthy()
  })

  it("displays formatting toolbar buttons", () => {
    const { container } = render(<CommentForm {...defaultProps} />)
    expect(container.querySelector('.lucide-bold')).toBeTruthy()
    expect(container.querySelector('.lucide-italic')).toBeTruthy()
    expect(container.querySelector('.lucide-link')).toBeTruthy()
  })

  it("shows mention and emoji buttons", () => {
    const { container } = render(<CommentForm {...defaultProps} />)
    expect(container.querySelector('.lucide-at-sign')).toBeTruthy()
    expect(container.querySelector('.lucide-smile')).toBeTruthy()
  })

  it("displays attach file button", () => {
    const { container } = render(<CommentForm {...defaultProps} />)
    expect(container.querySelector('.lucide-paperclip')).toBeTruthy()
  })

  it("shows character count", () => {
    render(<CommentForm {...defaultProps} maxLength={5000} />)
    expect(screen.getByText(/0 \/ 5000/i)).toBeTruthy()
  })

  it("updates character count when typing", () => {
    render(<CommentForm {...defaultProps} maxLength={5000} />)
    const textarea = screen.getByPlaceholderText(/Write a comment/i)
    fireEvent.change(textarea, { target: { value: "Hello" } })
    expect(screen.getByText(/5 \/ 5000/i)).toBeTruthy()
  })

  it("disables submit button when content is empty", () => {
    render(<CommentForm {...defaultProps} />)
    const submitButton = screen.getByText(/Post Comment/i)
    expect(submitButton).toBeDisabled()
  })

  it("enables submit button when content is entered", () => {
    render(<CommentForm {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/Write a comment/i)
    fireEvent.change(textarea, { target: { value: "Test comment" } })

    const submitButton = screen.getByText(/Post Comment/i)
    expect(submitButton).not.toBeDisabled()
  })

  it("calls onSubmit with content when submitted", () => {
    render(<CommentForm {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/Write a comment/i)
    fireEvent.change(textarea, { target: { value: "Test comment" } })

    const submitButton = screen.getByText(/Post Comment/i)
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith("Test comment", [])
  })

  it("shows cancel button when showCancel is true", () => {
    render(<CommentForm {...defaultProps} showCancel={true} onCancel={mockOnCancel} />)
    expect(screen.getByText("Cancel")).toBeTruthy()
  })
})
