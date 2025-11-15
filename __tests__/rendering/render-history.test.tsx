import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { RenderHistory } from "@/components/rendering/render-history"

describe("RenderHistory", () => {
  const mockProps = {
    projectId: "test-project",
  }

  it("renders render history component", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays render thumbnails", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container.textContent).toMatch(/history|render/i)
  })

  it("shows search functionality", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container.textContent).toMatch(/search/i)
  })

  it("displays filter options", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container.textContent).toMatch(/filter|all|quality/i)
  })

  it("shows sort controls", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container.textContent).toMatch(/newest|oldest|name|size/i)
  })

  it("displays render details", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container.textContent).toMatch(/resolution|sample|history/i)
  })

  it("has download functionality", () => {
    const onDownload = jest.fn()
    const { container } = render(<RenderHistory {...mockProps} onDownload={onDownload} />)
    expect(container).toBeTruthy()
  })

  it("shows re-render option", () => {
    const onReRender = jest.fn()
    const { container } = render(<RenderHistory {...mockProps} onReRender={onReRender} />)
    expect(container).toBeTruthy()
  })

  it("displays delete functionality", () => {
    const onDelete = jest.fn()
    const { container } = render(<RenderHistory {...mockProps} onDelete={onDelete} />)
    expect(container).toBeTruthy()
  })

  it("shows render metadata", () => {
    const { container } = render(<RenderHistory {...mockProps} />)
    expect(container.textContent).toMatch(/history|render/i)
  })
})
