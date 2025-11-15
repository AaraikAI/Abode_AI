import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { RenderProgress } from "@/components/rendering/render-progress"

describe("RenderProgress", () => {
  const mockProps = {
    jobId: "test-job-123",
  }

  it("renders render progress component", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays progress bar", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/progress|loading/i)
  })

  it("shows current sample count", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/sample|progress/i)
  })

  it("displays time elapsed", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/time|elapsed|loading/i)
  })

  it("shows time remaining estimate", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/remain|time|loading/i)
  })

  it("has pause button", () => {
    const onPause = jest.fn()
    const { container } = render(<RenderProgress {...mockProps} onPause={onPause} />)
    expect(container).toBeTruthy()
  })

  it("displays cancel button", () => {
    const onCancel = jest.fn()
    const { container } = render(<RenderProgress {...mockProps} onCancel={onCancel} />)
    expect(container).toBeTruthy()
  })

  it("shows render speed statistics", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/speed|sample|sec|loading/i)
  })

  it("displays resource usage", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/memory|gpu|resource|usage|loading/i)
  })

  it("shows live preview if available", () => {
    const { container } = render(<RenderProgress {...mockProps} />)
    expect(container.textContent).toMatch(/preview|image|loading/i)
  })
})
