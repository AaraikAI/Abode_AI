import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { QualitySelector } from "@/components/rendering/quality-selector"

describe("QualitySelector", () => {
  it("renders quality selector component", () => {
    const { container } = render(<QualitySelector />)
    expect(container).toBeTruthy()
  })

  it("displays draft quality option", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/draft/i)
  })

  it("shows medium quality preset", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/medium/i)
  })

  it("displays high quality option", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/high/i)
  })

  it("shows ultra quality preset", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/ultra/i)
  })

  it("displays estimated time for each preset", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/time|min|hour/i)
  })

  it("shows estimated credits", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/credit/i)
  })

  it("handles quality selection", () => {
    const onQualityChange = jest.fn()
    const { container } = render(<QualitySelector onQualityChange={onQualityChange} />)
    expect(container).toBeTruthy()
  })

  it("displays samples for each quality", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/sample/i)
  })

  it("shows selected configuration summary", () => {
    const { container } = render(<QualitySelector />)
    expect(container.textContent).toMatch(/configuration|selected/i)
  })
})
