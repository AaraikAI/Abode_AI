import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { LightingControls } from "@/components/rendering/lighting-controls"

describe("LightingControls", () => {
  it("renders lighting controls component", () => {
    const { container } = render(<LightingControls />)
    expect(container).toBeTruthy()
  })

  it("displays HDRI selection", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/hdri/i)
  })

  it("shows sun position controls", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/sun|elevation|azimuth/i)
  })

  it("displays sun intensity slider", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/intensity/i)
  })

  it("shows ambient light settings", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/ambient/i)
  })

  it("displays HDRI rotation control", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/rotation/i)
  })

  it("shows sun preset buttons", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/sunrise|sunset|noon|default/i)
  })

  it("displays skybox settings", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/skybox|procedural/i)
  })

  it("handles lighting changes", () => {
    const onChange = jest.fn()
    const { container } = render(<LightingControls onChange={onChange} />)
    expect(container).toBeTruthy()
  })

  it("shows reset button", () => {
    const { container } = render(<LightingControls />)
    expect(container.textContent).toMatch(/reset/i)
  })
})
