import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent } from "@testing-library/react"
import { ShareDialog, ShareToken } from "@/components/collaboration/share-dialog"

describe("ShareDialog", () => {
  const mockShareToken: ShareToken = {
    token: "abc123",
    url: "https://example.com/share/abc123",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString(),
    accessCount: 5,
  }

  const mockOnInviteByEmail = jest.fn()
  const mockOnUpdateSettings = jest.fn()
  const mockOnGenerateToken = jest.fn()
  const mockOnRevokeToken = jest.fn()

  const defaultProps = {
    projectId: "project-123",
    projectName: "My Project",
    onInviteByEmail: mockOnInviteByEmail,
    onUpdateSettings: mockOnUpdateSettings,
    onGenerateToken: mockOnGenerateToken,
    onRevokeToken: mockOnRevokeToken,
    open: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders share dialog with project name", () => {
    render(<ShareDialog {...defaultProps} />)
    expect(screen.getByText(/Share "My Project"/i)).toBeTruthy()
  })

  it("displays email and link tabs", () => {
    render(<ShareDialog {...defaultProps} />)
    expect(screen.getByText("Invite by Email")).toBeTruthy()
    expect(screen.getByText("Share Link")).toBeTruthy()
  })

  it("shows email input in invite tab", () => {
    render(<ShareDialog {...defaultProps} />)
    expect(screen.getByPlaceholderText(/colleague@example.com/i)).toBeTruthy()
  })

  it("displays permission level selector", () => {
    render(<ShareDialog {...defaultProps} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThan(0)
  })

  it("disables send button when email is invalid", () => {
    render(<ShareDialog {...defaultProps} />)
    const sendButton = screen.getByText("Send Invitation")
    expect(sendButton).toBeDisabled()
  })

  it("enables send button when valid email is entered", () => {
    render(<ShareDialog {...defaultProps} />)
    const emailInput = screen.getByPlaceholderText(/colleague@example.com/i)
    fireEvent.change(emailInput, { target: { value: "test@example.com" } })

    const sendButton = screen.getByText("Send Invitation")
    expect(sendButton).not.toBeDisabled()
  })

  it("calls onInviteByEmail when send button clicked", () => {
    render(<ShareDialog {...defaultProps} />)
    const emailInput = screen.getByPlaceholderText(/colleague@example.com/i)
    fireEvent.change(emailInput, { target: { value: "test@example.com" } })

    const sendButton = screen.getByText("Send Invitation")
    fireEvent.click(sendButton)

    expect(mockOnInviteByEmail).toHaveBeenCalledWith("test@example.com", "viewer")
  })

  it("shows generate link button in link tab", () => {
    render(<ShareDialog {...defaultProps} />)
    const linkTab = screen.getByText("Share Link")
    fireEvent.click(linkTab)

    expect(screen.getByText("Generate Share Link")).toBeTruthy()
  })

  it("displays share link when token is provided", () => {
    render(<ShareDialog {...defaultProps} shareToken={mockShareToken} />)
    const linkTab = screen.getByText("Share Link")
    fireEvent.click(linkTab)

    expect(screen.getByDisplayValue(mockShareToken.url)).toBeTruthy()
  })

  it("shows copy button for generated link", () => {
    render(<ShareDialog {...defaultProps} shareToken={mockShareToken} />)
    const linkTab = screen.getByText("Share Link")
    fireEvent.click(linkTab)

    expect(screen.getByText("Copy")).toBeTruthy()
  })
})
