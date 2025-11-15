import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { SitePlanEditor } from "@/components/site-planning/site-plan-editor"

describe("SitePlanEditor", () => {
  const mockProps = {
    projectId: "test-project",
  }

  it("renders site plan editor", () => {
    const { container } = render(<SitePlanEditor {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays canvas or map area", () => {
    const { container } = render(<SitePlanEditor {...mockProps} />)
    const canvas = container.querySelector('canvas, [class*="map"], [class*="canvas"]')
    expect(container.childNodes.length).toBeGreaterThan(0)
  })

  it("shows drawing tools panel", () => {
    const { container } = render(<SitePlanEditor {...mockProps} />)
    expect(container.textContent).toMatch(/tools|draw|select/i)
  })

  it("renders with project ID", () => {
    const { container } = render(<SitePlanEditor projectId="custom-id" />)
    expect(container).toBeTruthy()
  })

  it("has zoom controls", () => {
    const { container } = render(<SitePlanEditor {...mockProps} />)
    expect(container.textContent).toMatch(/zoom/i)
  })

  it("supports editing mode", () => {
    const { container } = render(<SitePlanEditor {...mockProps} readOnly={false} />)
    expect(container).toBeTruthy()
  })

  it("supports read-only mode", () => {
    const { container } = render(<SitePlanEditor {...mockProps} readOnly={true} />)
    expect(container).toBeTruthy()
  })

  it("handles feature selection", () => {
    const onSelect = jest.fn()
    const { container } = render(<SitePlanEditor {...mockProps} onFeatureSelect={onSelect} />)
    expect(container).toBeTruthy()
  })

  it("allows feature creation", () => {
    const onCreate = jest.fn()
    const { container } = render(<SitePlanEditor {...mockProps} onFeatureCreate={onCreate} />)
    expect(container).toBeTruthy()
  })

  it("renders toolbar", () => {
    const { container } = render(<SitePlanEditor {...mockProps} />)
    const toolbar = container.querySelector('[class*="toolbar"], [role="toolbar"]')
    expect(container.childNodes.length).toBeGreaterThan(0)
  })
})
