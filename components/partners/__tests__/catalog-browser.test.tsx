import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CatalogBrowser } from "../catalog-browser"

describe("CatalogBrowser", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders catalog browser", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText("Partner Catalog")).toBeTruthy()
  })

  it("displays total partners", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText("Total Partners")).toBeTruthy()
  })

  it("shows verified partners", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText("Verified")).toBeTruthy()
  })

  it("displays trending partners", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText("Trending")).toBeTruthy()
  })

  it("has search input", () => {
    render(<CatalogBrowser />)
    const search = screen.getByPlaceholderText(/Search partners/)
    expect(search).toBeTruthy()
  })

  it("shows category filter", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText(/All Categories/)).toBeTruthy()
  })

  it("displays install button", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText("Install")).toBeTruthy()
  })

  it("shows partner ratings", () => {
    render(<CatalogBrowser />)
    const ratings = screen.getAllByText(/\d+\.\d+/)
    expect(ratings.length).toBeGreaterThan(0) || expect(screen.getByText(/rating/)).toBeTruthy()
  })

  it("displays total installs", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText("Total Installs")).toBeTruthy()
  })

  it("has pricing filter", () => {
    render(<CatalogBrowser />)
    expect(screen.getByText(/All Pricing/)).toBeTruthy()
  })
})
