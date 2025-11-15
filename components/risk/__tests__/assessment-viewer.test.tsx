import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AssessmentViewer } from "../assessment-viewer"

describe("AssessmentViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders assessment viewer", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Risk Assessment")).toBeTruthy()
  })

  it("displays total risks count", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Total Risks")).toBeTruthy()
  })

  it("shows critical risks", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Critical")).toBeTruthy()
  })

  it("displays risk categories", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText(/All Categories/)).toBeTruthy()
  })

  it("shows severity filter", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText(/All Severities/)).toBeTruthy()
  })

  it("renders risk list", () => {
    render(<AssessmentViewer />)
    const risks = screen.getAllByText(/Risk/)
    expect(risks.length).toBeGreaterThan(0)
  })

  it("displays average risk score", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Avg Risk Score")).toBeTruthy()
  })

  it("shows export button", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Export")).toBeTruthy()
  })

  it("has heat map view option", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Heat Map")).toBeTruthy()
  })

  it("displays mitigation strategies", () => {
    render(<AssessmentViewer />)
    expect(screen.getByText("Mitigated")).toBeTruthy()
  })
})
