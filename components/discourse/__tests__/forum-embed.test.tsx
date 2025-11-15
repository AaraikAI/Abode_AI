import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ForumEmbed } from "../forum-embed"

describe("ForumEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders forum embed", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Discussion Topics")).toBeTruthy()
  })

  it("displays total topics", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Total Topics")).toBeTruthy()
  })

  it("shows category cards", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Categories")).toBeTruthy()
  })

  it("has search input", () => {
    render(<ForumEmbed />)
    const search = screen.getByPlaceholderText(/Search topics/)
    expect(search).toBeTruthy()
  })

  it("displays new topic button", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("New Topic")).toBeTruthy()
  })

  it("shows topic replies count", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Total Replies")).toBeTruthy()
  })

  it("displays topic views", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Total Views")).toBeTruthy()
  })

  it("shows active users", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Active Users")).toBeTruthy()
  })

  it("has sort options", () => {
    render(<ForumEmbed />)
    expect(screen.getByText("Latest")).toBeTruthy()
  })

  it("displays topic tags", () => {
    render(<ForumEmbed />)
    const topics = screen.getAllByRole("button")
    expect(topics.length).toBeGreaterThan(0)
  })
})
