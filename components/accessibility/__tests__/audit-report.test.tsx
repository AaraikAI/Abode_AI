import { describe, expect, it, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AuditReport } from "../audit-report"

describe("AuditReport", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders audit report", () => {
    render(<AuditReport />)
    expect(screen.getByText("Accessibility Audit")).toBeTruthy()
  })

  it("displays accessibility score", () => {
    render(<AuditReport />)
    expect(screen.getByText("Score")).toBeTruthy()
  })

  it("shows critical issues count", () => {
    render(<AuditReport />)
    expect(screen.getByText("Critical Issues")).toBeTruthy()
  })

  it("displays WCAG compliance levels", () => {
    render(<AuditReport />)
    expect(screen.getByText(/Level A/)).toBeTruthy()
    expect(screen.getByText(/Level AA/)).toBeTruthy()
  })

  it("has run audit button", () => {
    render(<AuditReport />)
    expect(screen.getByText("Run Audit")).toBeTruthy()
  })

  it("shows export button", () => {
    render(<AuditReport />)
    expect(screen.getByText("Export")).toBeTruthy()
  })

  it("displays issue severity filter", () => {
    render(<AuditReport />)
    expect(screen.getByText(/All Severities/)).toBeTruthy()
  })

  it("shows tests passed count", () => {
    render(<AuditReport />)
    expect(screen.getByText("Tests Passed")).toBeTruthy()
  })

  it("displays issue recommendations", () => {
    render(<AuditReport />)
    const issues = screen.getAllByText(/Issue/)
    expect(issues.length).toBeGreaterThan(0) || expect(screen.getByText(/missing/)).toBeTruthy()
  })

  it("has WCAG criterion information", () => {
    render(<AuditReport />)
    expect(screen.getByText("WCAG AA")).toBeTruthy()
  })
})
