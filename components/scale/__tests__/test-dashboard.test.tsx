import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TestDashboard } from "../test-dashboard"

describe("TestDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders test dashboard", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Test Configuration")).toBeTruthy()
  })

  it("displays active users metric", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Active Users")).toBeTruthy()
  })

  it("shows requests per second", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Requests/sec")).toBeTruthy()
  })

  it("displays average response time", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Avg Response")).toBeTruthy()
  })

  it("shows error rate", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Error Rate")).toBeTruthy()
  })

  it("has start test button", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Start Test")).toBeTruthy()
  })

  it("displays virtual users slider", () => {
    render(<TestDashboard />)
    expect(screen.getByText(/Virtual Users/)).toBeTruthy()
  })

  it("shows duration configuration", () => {
    render(<TestDashboard />)
    expect(screen.getByText(/Duration/)).toBeTruthy()
  })

  it("displays test progress", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Test Progress")).toBeTruthy()
  })

  it("has performance metrics tabs", () => {
    render(<TestDashboard />)
    expect(screen.getByText("Response Time")).toBeTruthy()
    expect(screen.getByText("Throughput")).toBeTruthy()
  })
})
