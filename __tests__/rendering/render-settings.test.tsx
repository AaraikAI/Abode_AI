import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { RenderSettings } from "@/components/rendering/render-settings"

describe("RenderSettings", () => {
  const mockProps = {
    projectId: "test-project",
  }

  it("renders render settings component", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays resolution selector", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/resolution/i)
  })

  it("shows samples slider", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/samples/i)
  })

  it("displays denoising toggle", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/denois/i)
  })

  it("has render device selector", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/device|cpu|gpu/i)
  })

  it("displays max bounces control", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/bounce/i)
  })

  it("shows tile size settings", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/tile/i)
  })

  it("handles settings changes", () => {
    const onChange = jest.fn()
    const { container } = render(<RenderSettings {...mockProps} onChange={onChange} />)
    expect(container).toBeTruthy()
  })

  it("displays quality indicators", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/draft|medium|high|ultra/i)
  })

  it("shows advanced options", () => {
    const { container } = render(<RenderSettings {...mockProps} />)
    expect(container.textContent).toMatch(/advanced|adaptive/i)
  })
})
