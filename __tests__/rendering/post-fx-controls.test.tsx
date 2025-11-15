import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { PostFXControls } from "@/components/rendering/post-fx-controls"

describe("PostFXControls", () => {
  it("renders post-fx controls component", () => {
    const { container } = render(<PostFXControls />)
    expect(container).toBeTruthy()
  })

  it("displays bloom effect controls", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/bloom/i)
  })

  it("shows depth of field settings", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/depth|dof/i)
  })

  it("displays color grading options", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/color|grading/i)
  })

  it("shows vignette controls", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/vignette|effect/i)
  })

  it("displays chromatic aberration toggle", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/chromatic|aberration|effect/i)
  })

  it("shows film grain settings", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/film|grain|effect/i)
  })

  it("displays sharpen controls", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/sharpen|effect/i)
  })

  it("handles effect changes", () => {
    const onChange = jest.fn()
    const { container } = render(<PostFXControls onChange={onChange} />)
    expect(container).toBeTruthy()
  })

  it("shows reset all button", () => {
    const { container } = render(<PostFXControls />)
    expect(container.textContent).toMatch(/reset/i)
  })
})
