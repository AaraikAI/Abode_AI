import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeploymentStatus } from "../deployment-status"

describe("DeploymentStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders deployment status", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Edge Nodes")).toBeTruthy()
  })

  it("displays total nodes count", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Total Nodes")).toBeTruthy()
  })

  it("shows health status", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Health Status")).toBeTruthy()
  })

  it("displays deployed models", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Deployed Models")).toBeTruthy()
  })

  it("shows average latency", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Avg Latency")).toBeTruthy()
  })

  it("renders node list", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText(/Edge Node/)).toBeTruthy()
  })

  it("displays CPU usage", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText(/CPU/)).toBeTruthy()
  })

  it("shows memory usage", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText(/Memory/)).toBeTruthy()
  })

  it("has restart button", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Restart")).toBeTruthy()
  })

  it("displays metrics charts", () => {
    render(<DeploymentStatus />)
    expect(screen.getByText("Metrics")).toBeTruthy()
  })
})
