import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ChatInterface } from "../chat-interface"

describe("ChatInterface", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders chat interface", () => {
    render(<ChatInterface />)
    expect(screen.getByText("AI Reasoning Chat")).toBeTruthy()
  })

  it("displays initial system message", () => {
    render(<ChatInterface />)
    expect(screen.getByText(/I am Claude/)).toBeTruthy()
  })

  it("shows textarea for input", () => {
    render(<ChatInterface />)
    const textarea = screen.getByPlaceholderText(/Ask Claude/)
    expect(textarea).toBeTruthy()
  })

  it("has send button", () => {
    render(<ChatInterface />)
    const sendButton = screen.getAllByRole("button").find(btn =>
      btn.querySelector('svg')
    )
    expect(sendButton).toBeTruthy()
  })

  it("displays model selection", () => {
    render(<ChatInterface model="claude-3-sonnet" />)
    expect(screen.getByText(/Sonnet/)).toBeTruthy()
  })

  it("shows message timestamp", () => {
    render(<ChatInterface />)
    const timestamps = screen.getAllByText(/\d+:\d+/)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it("allows file attachment", () => {
    render(<ChatInterface />)
    const fileInput = screen.getByRole("button", { hidden: true })
    expect(fileInput).toBeTruthy()
  })

  it("displays reasoning badge", () => {
    render(<ChatInterface />)
    expect(screen.getByText("Advanced Reasoning")).toBeTruthy()
  })

  it("shows copy button for messages", () => {
    render(<ChatInterface />)
    expect(screen.getByText("Copy")).toBeTruthy()
  })

  it("displays feedback buttons", () => {
    render(<ChatInterface />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(5)
  })
})
