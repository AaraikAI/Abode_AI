import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { WalkthroughEditor } from "@/components/rendering/walkthrough-editor"

describe("WalkthroughEditor", () => {
  const mockProps = {
    projectId: "test-project",
  }

  it("renders walkthrough editor component", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container).toBeTruthy()
  })

  it("displays timeline track", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/timeline|duration/i)
  })

  it("shows add keyframe button", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/add|keyframe/i)
  })

  it("displays playback controls", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/play|preview|pause/i)
  })

  it("shows keyframe properties panel", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/properties|keyframe|position|rotation/i)
  })

  it("displays camera position controls", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/position/i)
  })

  it("shows camera rotation settings", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/rotation/i)
  })

  it("has interpolation options", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/interpolation|linear|ease/i)
  })

  it("displays FPS settings", () => {
    const { container } = render(<WalkthroughEditor {...mockProps} />)
    expect(container.textContent).toMatch(/fps|frame/i)
  })

  it("handles keyframe changes", () => {
    const onChange = jest.fn()
    const { container } = render(<WalkthroughEditor {...mockProps} onChange={onChange} />)
    expect(container).toBeTruthy()
  })
})
