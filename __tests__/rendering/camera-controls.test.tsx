import { describe, expect, it, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { CameraControls } from "@/components/rendering/camera-controls"

describe("CameraControls", () => {
  it("renders camera controls component", () => {
    const { container } = render(<CameraControls />)
    expect(container).toBeTruthy()
  })

  it("displays FOV control", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/fov|field of view/i)
  })

  it("shows focal length settings", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/focal/i)
  })

  it("displays focus distance control", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/focus|distance/i)
  })

  it("shows aperture settings", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/aperture|f-stop/i)
  })

  it("displays exposure controls", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/exposure/i)
  })

  it("shows clipping plane settings", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/clip/i)
  })

  it("displays camera presets", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/preset|wide|standard|portrait/i)
  })

  it("has save preset functionality", () => {
    const onSavePreset = jest.fn()
    const { container } = render(<CameraControls onSavePreset={onSavePreset} />)
    expect(container.textContent).toMatch(/save|preset/i)
  })

  it("displays camera position and rotation", () => {
    const { container } = render(<CameraControls />)
    expect(container.textContent).toMatch(/position|rotation/i)
  })
})
