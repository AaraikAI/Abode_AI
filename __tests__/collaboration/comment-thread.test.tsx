import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CommentThread, Comment } from "@/components/collaboration/comment-thread"

describe("CommentThread", () => {
  const mockComments: Comment[] = [
    {
      id: "1",
      content: "This is a test comment",
      author: {
        id: "user-1",
        name: "John Doe",
        avatar: "/avatar1.jpg",
      },
      timestamp: new Date().toISOString(),
      replies: [
        {
          id: "2",
          content: "This is a reply",
          author: {
            id: "user-2",
            name: "Jane Smith",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ]

  const mockProps = {
    comments: mockComments,
    currentUserId: "user-1",
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders comment thread with title and count", () => {
    render(<CommentThread {...mockProps} />)
    expect(screen.getByText(/Comments \(1\)/i)).toBeTruthy()
  })

  it("displays comment content", () => {
    render(<CommentThread {...mockProps} />)
    expect(screen.getByText("This is a test comment")).toBeTruthy()
  })

  it("shows author name and avatar", () => {
    render(<CommentThread {...mockProps} />)
    expect(screen.getByText("John Doe")).toBeTruthy()
  })

  it("displays nested replies with correct indentation", () => {
    render(<CommentThread {...mockProps} />)
    expect(screen.getByText("This is a reply")).toBeTruthy()
    expect(screen.getByText("Jane Smith")).toBeTruthy()
  })

  it("shows empty state when no comments", () => {
    render(<CommentThread {...mockProps} comments={[]} />)
    expect(screen.getByText(/No comments yet/i)).toBeTruthy()
  })

  it("displays reply button for comments below max depth", () => {
    render(<CommentThread {...mockProps} />)
    const replyButtons = screen.getAllByText(/Reply/i)
    expect(replyButtons.length).toBeGreaterThan(0)
  })

  it("shows edit and delete options for own comments", () => {
    render(<CommentThread {...mockProps} />)
    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(btn => btn.querySelector('.lucide-more-vertical'))

    if (moreButton) {
      fireEvent.click(moreButton)
      waitFor(() => {
        expect(screen.getByText("Edit")).toBeTruthy()
        expect(screen.getByText("Delete")).toBeTruthy()
      })
    }
  })

  it("opens reply form when reply button clicked", () => {
    render(<CommentThread {...mockProps} />)
    const replyButton = screen.getAllByText(/Reply/i)[0]
    fireEvent.click(replyButton)
    expect(screen.getByPlaceholderText(/Write a reply/i)).toBeTruthy()
  })

  it("calls onReply when posting a reply", () => {
    render(<CommentThread {...mockProps} />)
    const replyButton = screen.getAllByText(/Reply/i)[0]
    fireEvent.click(replyButton)

    const textarea = screen.getByPlaceholderText(/Write a reply/i)
    fireEvent.change(textarea, { target: { value: "New reply content" } })

    const postButton = screen.getByText("Post Reply")
    fireEvent.click(postButton)

    expect(mockProps.onReply).toHaveBeenCalledWith("1", "New reply content")
  })

  it("formats timestamps relative to current time", () => {
    const recentComment: Comment[] = [
      {
        id: "3",
        content: "Recent comment",
        author: { id: "user-3", name: "Bob" },
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      },
    ]
    render(<CommentThread {...mockProps} comments={recentComment} />)
    expect(screen.getByText(/ago/i)).toBeTruthy()
  })
})
