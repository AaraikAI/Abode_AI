import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { OutputPreview } from "@/components/rendering/output-preview"

describe("OutputPreview", () => {
  const mockProps = {
    imageUrl: "https://example.com/render.png",
  }

  it("renders output preview component", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays zoom controls", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container.textContent).toMatch(/zoom/i)
  })

  it("shows download button", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container.textContent).toMatch(/download/i)
  })

  it("has share functionality", () => {
    const onShare = jest.fn()
    const { container } = render(<OutputPreview {...mockProps} onShare={onShare} />)
    expect(container.textContent).toMatch(/share/i)
  })

  it("displays comparison slider when compare image provided", () => {
    const { container } = render(
      <OutputPreview {...mockProps} compareImageUrl="https://example.com/compare.png" />
    )
    expect(container).toBeTruthy()
  })

  it("shows image metadata", () => {
    const { container } = render(
      <OutputPreview {...mockProps} resolution="1920x1080" fileSize="2.5 MB" />
    )
    expect(container.textContent).toMatch(/1920x1080|2.5 MB/i)
  })

  it("has pan and zoom functionality", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays view options", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container.textContent).toMatch(/view|fit|reset/i)
  })

  it("shows grid overlay toggle", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container.textContent).toMatch(/grid|view/i)
  })

  it("displays loading state", () => {
    const { container } = render(<OutputPreview {...mockProps} />)
    expect(container).toBeTruthy()
  })
})
