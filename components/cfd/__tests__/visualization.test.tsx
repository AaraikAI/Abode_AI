import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Visualization } from "../visualization"

describe("Visualization", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders CFD visualization", () => {
    render(<Visualization />)
    expect(screen.getByText("CFD Visualization")).toBeTruthy()
  })

  it("displays max velocity metric", () => {
    render(<Visualization />)
    expect(screen.getByText("Max Velocity")).toBeTruthy()
  })

  it("shows temperature stats", () => {
    render(<Visualization />)
    expect(screen.getByText("Temperature")).toBeTruthy()
  })

  it("has simulation controls", () => {
    render(<Visualization />)
    expect(screen.getByText("Simulation Controls")).toBeTruthy()
  })

  it("displays start button", () => {
    render(<Visualization />)
    expect(screen.getByText("Start Simulation")).toBeTruthy()
  })

  it("shows visualization canvas", () => {
    render(<Visualization />)
    const canvas = screen.getByRole("img", { hidden: true }) || document.querySelector("canvas")
    expect(canvas).toBeTruthy()
  })

  it("has wind speed control", () => {
    render(<Visualization />)
    expect(screen.getByText(/Wind Speed/)).toBeTruthy()
  })

  it("displays turbulence level", () => {
    render(<Visualization />)
    expect(screen.getByText("Turbulence")).toBeTruthy()
  })

  it("shows simulation status", () => {
    render(<Visualization />)
    expect(screen.getByText(/Status/)).toBeTruthy()
  })

  it("has physics configuration tab", () => {
    render(<Visualization />)
    expect(screen.getByText("Physics")).toBeTruthy()
  })
})
